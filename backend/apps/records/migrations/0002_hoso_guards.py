from django.db import migrations


def install_guards(apps, schema_editor):
    vendor = schema_editor.connection.vendor
    with schema_editor.connection.cursor() as cursor:
        if vendor == "postgresql":
            cursor.execute("""
                CREATE OR REPLACE FUNCTION records_set_updated_at()
                RETURNS TRIGGER AS $$
                BEGIN
                  NEW.updated_at := now();
                  RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            """)
            cursor.execute("""
                DO $$ BEGIN
                  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hoso_updated_at'
                    AND tgrelid = 'records_hoso'::regclass) THEN
                    CREATE TRIGGER trg_hoso_updated_at BEFORE UPDATE ON records_hoso
                    FOR EACH ROW EXECUTE FUNCTION records_set_updated_at();
                  END IF;
                END $$;
            """)
            cursor.execute("""
                DO $$ BEGIN
                  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_loaivanban_updated_at'
                    AND tgrelid = 'records_loaivanban'::regclass) THEN
                    CREATE TRIGGER trg_loaivanban_updated_at BEFORE UPDATE ON records_loaivanban
                    FOR EACH ROW EXECUTE FUNCTION records_set_updated_at();
                  END IF;
                END $$;
            """)
            cursor.execute("""
                CREATE OR REPLACE FUNCTION auto_stt_uu_tien_hoso()
                RETURNS TRIGGER AS $$
                BEGIN
                  IF NEW.stt_uu_tien IS NULL OR NEW.stt_uu_tien = 0 THEN
                    PERFORM pg_advisory_xact_lock('records_hoso'::regclass::oid::bigint);
                    NEW.stt_uu_tien := COALESCE(
                      (SELECT MAX(stt_uu_tien) FROM records_hoso), 0
                    ) + 1;
                  END IF;
                  RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            """)
            cursor.execute("""
                DO $$ BEGIN
                  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hoso_auto_stt'
                    AND tgrelid = 'records_hoso'::regclass) THEN
                    CREATE TRIGGER trg_hoso_auto_stt BEFORE INSERT ON records_hoso
                    FOR EACH ROW EXECUTE FUNCTION auto_stt_uu_tien_hoso();
                  END IF;
                END $$;
            """)
            cursor.execute("""
                CREATE OR REPLACE FUNCTION prevent_delete_he_thong_hoso()
                RETURNS TRIGGER AS $$
                BEGIN
                  IF OLD.is_he_thong = TRUE THEN
                    RAISE EXCEPTION 'Không thể xóa Hồ sơ chung / bản ghi hệ thống (records_hoso id=%).', OLD.id;
                  END IF;
                  RETURN OLD;
                END;
                $$ LANGUAGE plpgsql;
            """)
            cursor.execute("""
                DO $$ BEGIN
                  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hoso_prevent_delete'
                    AND tgrelid = 'records_hoso'::regclass) THEN
                    CREATE TRIGGER trg_hoso_prevent_delete BEFORE DELETE ON records_hoso
                    FOR EACH ROW EXECUTE FUNCTION prevent_delete_he_thong_hoso();
                  END IF;
                END $$;
            """)
        elif vendor == "sqlite":
            cursor.execute("""
                CREATE TRIGGER IF NOT EXISTS trg_hoso_prevent_delete
                BEFORE DELETE ON records_hoso WHEN OLD.is_he_thong = 1
                BEGIN
                  SELECT RAISE(ABORT, 'Không thể xóa Hồ sơ chung / bản ghi hệ thống.');
                END;
            """)


def remove_guards(apps, schema_editor):
    vendor = schema_editor.connection.vendor
    with schema_editor.connection.cursor() as cursor:
        if vendor == "postgresql":
            cursor.execute("DROP TRIGGER IF EXISTS trg_hoso_updated_at ON records_hoso")
            cursor.execute("DROP TRIGGER IF EXISTS trg_loaivanban_updated_at ON records_loaivanban")
            cursor.execute("DROP TRIGGER IF EXISTS trg_hoso_auto_stt ON records_hoso")
            cursor.execute("DROP TRIGGER IF EXISTS trg_hoso_prevent_delete ON records_hoso")
            cursor.execute("DROP FUNCTION IF EXISTS records_set_updated_at()")
            cursor.execute("DROP FUNCTION IF EXISTS auto_stt_uu_tien_hoso()")
            cursor.execute("DROP FUNCTION IF EXISTS prevent_delete_he_thong_hoso()")
        elif vendor == "sqlite":
            cursor.execute("DROP TRIGGER IF EXISTS trg_hoso_prevent_delete")


class Migration(migrations.Migration):
    dependencies = [("records", "0001_initial")]

    operations = [migrations.RunPython(install_guards, remove_guards)]
