# Generated for Issue #47: Sync P0, P1, P2 signing schema
from django.db import migrations


def run_pg_sql(apps, schema_editor):
    """
    Chỉ thực thi DDL PostgreSQL khi kết nối tới cơ sở dữ liệu PostgreSQL.
    Bỏ qua an toàn khi chạy trên SQLite/test runner để không gây xung đột cú pháp PL/pgSQL/ENUM.
    """
    if schema_editor.connection.vendor != "postgresql":
        return

    sql_statements = """
    -- P0.1: signing_request document_type NOT NULL DEFAULT 'vanbanden' có backfill
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_kind') THEN
            CREATE TYPE document_kind AS ENUM ('vanbanden', 'vanbandi', 'vanbanmat');
        END IF;
    END $$;

    ALTER TABLE signing_request ADD COLUMN IF NOT EXISTS document_type document_kind;
    UPDATE signing_request SET document_type = 'vanbanden' WHERE document_type IS NULL;
    ALTER TABLE signing_request ALTER COLUMN document_type SET DEFAULT 'vanbanden';
    ALTER TABLE signing_request ALTER COLUMN document_type SET NOT NULL;

    -- P0.2: Index (document_type, van_ban_id)
    CREATE INDEX IF NOT EXISTS idx_signing_request_document ON signing_request (document_type, van_ban_id);

    -- P0.3: Trigger bảo vệ signing_signature
    CREATE OR REPLACE FUNCTION prevent_delete_or_tamper_signing_signature()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Chữ ký số điện tử (signing_signature id=%) là bất biến và không thể xóa khỏi CSDL.', OLD.id;
        ELSIF TG_OP = 'UPDATE' THEN
            IF OLD.luot_trinh_id IS DISTINCT FROM NEW.luot_trinh_id
               OR OLD.buoc_ky_id IS DISTINCT FROM NEW.buoc_ky_id
               OR OLD.khoa_ky_id IS DISTINCT FROM NEW.khoa_ky_id
               OR OLD.hash_tai_lieu IS DISTINCT FROM NEW.hash_tai_lieu
               OR OLD.thuat_toan IS DISTINCT FROM NEW.thuat_toan
               OR OLD.chu_ky_so IS DISTINCT FROM NEW.chu_ky_so
               OR OLD.ngay_ky IS DISTINCT FROM NEW.ngay_ky
               OR OLD.vi_tri_anh_chu_ky IS DISTINCT FROM NEW.vi_tri_anh_chu_ky
               OR OLD.ma_bam_anh_chu_ky IS DISTINCT FROM NEW.ma_bam_anh_chu_ky THEN
                RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Không được phép sửa đổi thông tin cốt lõi của chữ ký số (signing_signature id=%). Chỉ cho phép cập nhật kết quả xác minh.', OLD.id;
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_signing_signature_immutable ON signing_signature;
    DROP TRIGGER IF EXISTS trg_signing_signature_prevent_delete ON signing_signature;
    CREATE TRIGGER trg_signing_signature_immutable
        BEFORE UPDATE OR DELETE ON signing_signature
        FOR EACH ROW EXECUTE FUNCTION prevent_delete_or_tamper_signing_signature();

    -- P0.4 & P0.5: Trigger bảo vệ signing_manifest khi DA_CHOT
    CREATE OR REPLACE FUNCTION protect_final_manifest()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'DELETE' THEN
            IF OLD.trang_thai IN ('DA_CHOT', 'CHOT', 'FINAL') THEN
                RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Không thể xóa manifest số đã chốt (signing_manifest id=%, phien_ban=%).', OLD.id, OLD.phien_ban_bang_chung;
            END IF;
            RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
            IF OLD.trang_thai IN ('DA_CHOT', 'CHOT', 'FINAL') THEN
                RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Manifest số đã chốt (DA_CHOT) là bất biến và không thể sửa đổi (signing_manifest id=%).', OLD.id;
            END IF;
            RETURN NEW;
        END IF;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_signing_manifest_protect ON signing_manifest;
    DROP TRIGGER IF EXISTS trg_signing_manifest_prevent_delete ON signing_manifest;
    CREATE TRIGGER trg_signing_manifest_protect
        BEFORE UPDATE OR DELETE ON signing_manifest
        FOR EACH ROW EXECUTE FUNCTION protect_final_manifest();

    -- P0.6: Trigger WORM signing_audit_log
    CREATE OR REPLACE FUNCTION prevent_modify_signing_audit_log()
    RETURNS TRIGGER AS $$
    BEGIN
        RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Nhật ký kiểm toán (signing_audit_log id=%) tuân thủ chuẩn WORM, nghiêm cấm mọi hành vi sửa đổi hoặc xóa.', OLD.id;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_signing_audit_log_immutable ON signing_audit_log;
    CREATE TRIGGER trg_signing_audit_log_immutable
        BEFORE UPDATE OR DELETE ON signing_audit_log
        FOR EACH ROW EXECUTE FUNCTION prevent_modify_signing_audit_log();

    -- P0.7: 3 FK của signing_audit_log -> ON DELETE RESTRICT
    DO $$
    DECLARE
        r RECORD;
    BEGIN
        FOR r IN (
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'signing_audit_log'::regclass
              AND contype = 'f'
              AND conname IN (
                  'signing_audit_log_trinh_ky_id_fkey',
                  'signing_audit_log_luot_trinh_id_fkey',
                  'signing_audit_log_buoc_ky_id_fkey',
                  'fk_signing_audit_log_trinh_ky',
                  'fk_signing_audit_log_luot_trinh',
                  'fk_signing_audit_log_buoc_ky'
              )
        ) LOOP
            EXECUTE 'ALTER TABLE signing_audit_log DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        END LOOP;
    END $$;

    ALTER TABLE signing_audit_log
        DROP CONSTRAINT IF EXISTS fk_signing_audit_log_trinh_ky,
        ADD CONSTRAINT fk_signing_audit_log_trinh_ky FOREIGN KEY (trinh_ky_id) REFERENCES signing_request (id) ON DELETE RESTRICT;

    ALTER TABLE signing_audit_log
        DROP CONSTRAINT IF EXISTS fk_signing_audit_log_luot_trinh,
        ADD CONSTRAINT fk_signing_audit_log_luot_trinh FOREIGN KEY (luot_trinh_id) REFERENCES signing_attempt (id) ON DELETE RESTRICT;

    ALTER TABLE signing_audit_log
        DROP CONSTRAINT IF EXISTS fk_signing_audit_log_buoc_ky,
        ADD CONSTRAINT fk_signing_audit_log_buoc_ky FOREIGN KEY (buoc_ky_id) REFERENCES signing_request_step_signer (id) ON DELETE RESTRICT;

    -- P1.1: 5 Quyền trình ký (Tổng cộng 73 quyền)
    INSERT INTO auth_permission (name, codename, module_ten)
    VALUES
        ('Quản lý quy trình trình ký', 'manage_signing_process', 'Trình ký'),
        ('Gửi trình ký / Nộp lại lượt trình', 'send_trinhky', 'Trình ký'),
        ('Ủy quyền ký số', 'delegate_trinhky', 'Trình ký'),
        ('Hủy yêu cầu trình ký', 'cancel_trinhky', 'Trình ký'),
        ('Xem nhật ký kiểm toán trình ký', 'view_signing_audit', 'Trình ký')
    ON CONFLICT (codename) DO UPDATE
    SET
        name = EXCLUDED.name,
        module_ten = EXCLUDED.module_ten;

    -- Mapping quyền vào ADMIN và BGD
    INSERT INTO auth_group_permissions (group_id, permission_id)
    SELECT g.id, p.id
    FROM auth_group g
    CROSS JOIN auth_permission p
    WHERE g.ma_nhom_quyen = 'ADMIN'
    ON CONFLICT (group_id, permission_id) DO NOTHING;

    INSERT INTO auth_group_permissions (group_id, permission_id)
    SELECT g.id, p.id
    FROM auth_group g, auth_permission p
    WHERE g.ma_nhom_quyen = 'BGD'
      AND p.codename IN ('send_trinhky', 'delegate_trinhky', 'cancel_trinhky', 'view_signing_audit')
    ON CONFLICT (group_id, permission_id) DO NOTHING;

    -- P1.2: FK liên quan đổi sang ON DELETE RESTRICT
    DO $$
    DECLARE
        r RECORD;
    BEGIN
        FOR r IN (
            SELECT conrelid::regclass AS tbl, conname
            FROM pg_constraint
            WHERE contype = 'f'
              AND (
                  (conrelid = 'signing_change_thread'::regclass AND conname LIKE '%luot_trinh%')
                  OR (conrelid = 'signing_change_message'::regclass AND conname LIKE '%yeu_cau_sua%')
                  OR (conrelid = 'signing_process_step_signer'::regclass AND (conname LIKE '%nguoi_ky%' OR conname LIKE '%chuc_vu%'))
              )
        ) LOOP
            EXECUTE 'ALTER TABLE ' || r.tbl || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        END LOOP;
    END $$;

    ALTER TABLE signing_change_thread
        DROP CONSTRAINT IF EXISTS fk_signing_change_thread_luot_trinh,
        ADD CONSTRAINT fk_signing_change_thread_luot_trinh FOREIGN KEY (luot_trinh_id) REFERENCES signing_attempt (id) ON DELETE RESTRICT;

    ALTER TABLE signing_change_message
        DROP CONSTRAINT IF EXISTS fk_signing_change_message_yeu_cau_sua,
        ADD CONSTRAINT fk_signing_change_message_yeu_cau_sua FOREIGN KEY (yeu_cau_sua_id) REFERENCES signing_change_thread (id) ON DELETE RESTRICT;

    ALTER TABLE signing_process_step_signer
        DROP CONSTRAINT IF EXISTS fk_signing_process_step_signer_nguoi_ky,
        ADD CONSTRAINT fk_signing_process_step_signer_nguoi_ky FOREIGN KEY (nguoi_ky_id) REFERENCES accounts_employee (id) ON DELETE RESTRICT;

    ALTER TABLE signing_process_step_signer
        DROP CONSTRAINT IF EXISTS fk_signing_process_step_signer_chuc_vu,
        ADD CONSTRAINT fk_signing_process_step_signer_chuc_vu FOREIGN KEY (chuc_vu_id) REFERENCES accounts_position (id) ON DELETE RESTRICT;

    -- P1.3: signing_audit_log.dia_chi_ip cho phép NULL, bỏ default 127.0.0.1
    ALTER TABLE signing_audit_log ALTER COLUMN dia_chi_ip DROP DEFAULT;
    ALTER TABLE signing_audit_log ALTER COLUMN dia_chi_ip DROP NOT NULL;

    -- P1.4: Cho phép NULL ở các cột draft
    ALTER TABLE signing_request ALTER COLUMN phien_ban_van_ban DROP NOT NULL;
    ALTER TABLE signing_request ALTER COLUMN vi_tri_luu_tep DROP NOT NULL;
    ALTER TABLE signing_request ALTER COLUMN ma_bam_tai_lieu DROP NOT NULL;

    ALTER TABLE signing_attempt ALTER COLUMN phien_ban_van_ban DROP NOT NULL;

    ALTER TABLE signing_request_step_signer ALTER COLUMN ten_chuc_vu DROP NOT NULL;
    ALTER TABLE signing_request_step_signer ALTER COLUMN khoa_chong_trung_thao_tac DROP NOT NULL;

    ALTER TABLE signing_manifest ALTER COLUMN vi_tri_luu DROP NOT NULL;

    -- P2: Index nhắc hạn
    CREATE INDEX IF NOT EXISTS idx_signing_request_hanchot ON signing_request (han_chot);
    CREATE INDEX IF NOT EXISTS idx_signing_request_step_hanxuly ON signing_request_step (han_xu_ly);
    """
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(sql_statements)


def reverse_pg_sql(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return

    reverse_sql = """
    DROP INDEX IF EXISTS idx_signing_request_hanchot;
    DROP INDEX IF EXISTS idx_signing_request_step_hanxuly;
    DROP INDEX IF EXISTS idx_signing_request_document;

    DELETE FROM auth_group_permissions
    WHERE permission_id IN (
        SELECT id FROM auth_permission WHERE codename IN (
            'manage_signing_process', 'send_trinhky', 'delegate_trinhky', 'cancel_trinhky', 'view_signing_audit'
        )
    );

    DELETE FROM auth_permission
    WHERE codename IN (
        'manage_signing_process', 'send_trinhky', 'delegate_trinhky', 'cancel_trinhky', 'view_signing_audit'
    );

    DROP TRIGGER IF EXISTS trg_signing_signature_immutable ON signing_signature;
    DROP TRIGGER IF EXISTS trg_signing_manifest_protect ON signing_manifest;
    DROP TRIGGER IF EXISTS trg_signing_audit_log_immutable ON signing_audit_log;
    """
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(reverse_sql)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(run_pg_sql, reverse_pg_sql),
    ]
