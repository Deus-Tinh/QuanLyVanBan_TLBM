"""Test cho compare_schema_ddl.drift: mỗi ca dựng hai DB tạm trên PostgreSQL rồi kiểm tra lệch.

Dùng: python -m unittest discover -s .github/scripts -p "test_*.py"
Kết nối lấy từ POSTGRES_HOST/PORT/USER/PASSWORD (cần quyền CREATEDB).
"""
import unittest
import uuid

import psycopg
from psycopg import sql

import compare_schema_ddl as cmp

BASE = """
CREATE TABLE seed_t (id serial PRIMARY KEY, name text NOT NULL);
INSERT INTO seed_t (name) VALUES ('a'), ('b');
CREATE TABLE trig_t (id serial PRIMARY KEY, name text);
CREATE FUNCTION trg_fn() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE TRIGGER trg_t BEFORE INSERT ON trig_t FOR EACH ROW EXECUTE FUNCTION trg_fn();
CREATE FUNCTION lit_fn() RETURNS text LANGUAGE sql AS $$ SELECT 'x y'::text $$;
CREATE VIEW lit_v AS SELECT 'x y'::text AS v;
"""


def maintenance():
    return cmp.connect("postgres")


class DriftTest(unittest.TestCase):
    def setUp(self):
        self.dbs = []

    def tearDown(self):
        with maintenance() as conn:
            conn.autocommit = True
            for db in self.dbs:
                conn.execute(sql.SQL("DROP DATABASE IF EXISTS {}").format(sql.Identifier(db)))

    def make_db(self, script):
        name = "cmp_test_" + uuid.uuid4().hex[:10]
        with maintenance() as conn:
            conn.autocommit = True
            conn.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(name)))
        self.dbs.append(name)
        with cmp.connect(name) as conn:
            conn.execute(script)
        return name

    def drift(self, migration_script, ddl_script=BASE):
        return cmp.drift(self.make_db(migration_script), self.make_db(ddl_script))

    def test_identical_dbs_have_no_drift(self):
        self.assertEqual(self.drift(BASE), [])

    def test_disabled_trigger_is_reported(self):
        found = self.drift(BASE + "ALTER TABLE trig_t DISABLE TRIGGER trg_t;")
        self.assertEqual(found, ["TRIGGER trig_t.trg_t: trạng thái migration D | DDL O"])

    def test_function_differing_only_in_literal_whitespace(self):
        found = self.drift(BASE.replace("SELECT 'x y'::text $$", "SELECT 'x  y'::text $$"))
        self.assertEqual(found, ["FUNCTION lit_fn(): khác định nghĩa so với DDL"])

    def test_view_differing_only_in_literal_whitespace(self):
        found = self.drift(BASE.replace("SELECT 'x y'::text AS v", "SELECT 'x  y'::text AS v"))
        self.assertEqual(found, ["VIEW lit_v: khác định nghĩa so với DDL"])

    def test_seed_value_change_keeps_counts_but_changes_fingerprint(self):
        changed_b = self.drift(BASE.replace("('a'), ('b')", "('a'), ('c')"))
        changed_d = self.drift(BASE.replace("('a'), ('b')", "('a'), ('d')"))
        self.assertEqual(len(changed_b), 1)
        self.assertEqual(len(changed_d), 1)
        self.assertTrue(changed_b[0].startswith("SEED seed_t: DDL 2 dòng, migration thiếu 1 #"))
        self.assertIn(", thừa 1 #", changed_b[0])
        self.assertNotEqual(changed_b[0], changed_d[0])

    def test_table_with_data_only_in_migration_db(self):
        found = self.drift(BASE + "INSERT INTO trig_t (name) VALUES ('x');")
        self.assertEqual(len(found), 1)
        self.assertTrue(found[0].startswith("SEED trig_t: DDL 0 dòng, migration thiếu 0 #-, thừa 1 #"))


if __name__ == "__main__":
    unittest.main()
