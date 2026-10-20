"""Test collation của scripts/build_db.py: DB tạo mới và --force phải là ICU vi-VN, DB có collation khác bị từ chối.

Dùng: python -m unittest discover -s scripts -p "test_build_db.py"
Kết nối lấy từ DB_HOST, DB_PORT, DB_USER, DB_PASSWORD (cần quyền CREATEDB).
"""
import os
import unittest
import uuid
from argparse import Namespace
from unittest import mock

from psycopg import sql

import build_db


class CollationTest(unittest.TestCase):
    def setUp(self):
        self.args = Namespace(
            host=os.environ.get("DB_HOST", "localhost"), port=os.environ.get("DB_PORT", "5432"),
            user=os.environ.get("DB_USER", "postgres"), dbname="build_db_test_" + uuid.uuid4().hex[:10],
            force=False, if_empty=False,
        )

    def tearDown(self):
        with build_db.connect(self.args, "postgres", autocommit=True) as conn:
            conn.execute(sql.SQL("DROP DATABASE IF EXISTS {} WITH (FORCE)").format(sql.Identifier(self.args.dbname)))

    def collation(self):
        with build_db.connect(self.args, "postgres", autocommit=True) as conn:
            return build_db.read_collation(conn, self.args.dbname)

    def create_with_icu_locale(self, icu_locale):
        with build_db.connect(self.args, "postgres", autocommit=True) as conn:
            conn.execute(
                sql.SQL(
                    "CREATE DATABASE {} TEMPLATE template0 ENCODING 'UTF8' "
                    "LOCALE_PROVIDER icu ICU_LOCALE {} LOCALE 'C.UTF-8'"
                ).format(sql.Identifier(self.args.dbname), sql.Literal(icu_locale))
            )

    def test_new_database_is_icu_vi_vn(self):
        self.assertEqual(build_db.prepare_database(self.args), ("drop", False))
        self.assertEqual(self.collation(), ("i", "vi-VN"))

    def test_force_recreates_with_icu_vi_vn(self):
        self.create_with_icu_locale("en-US")
        self.args.force = True
        self.assertEqual(build_db.prepare_database(self.args), ("drop", False))
        self.assertEqual(self.collation(), ("i", "vi-VN"))

    def exists(self):
        with build_db.connect(self.args, "postgres", autocommit=True) as conn:
            return conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", [self.args.dbname]).fetchone()

    def wrong_collation_create_sql(self):
        return mock.patch.object(build_db, "CREATE_DATABASE", build_db.CREATE_DATABASE.replace("vi-VN", "en-US"))

    def test_new_database_with_failed_collation_check_is_dropped(self):
        with self.wrong_collation_create_sql(), self.assertRaises(SystemExit):
            build_db.prepare_database(self.args)
        self.assertIsNone(self.exists())

    def test_force_database_with_failed_collation_check_is_dropped(self):
        self.create_with_icu_locale("vi-VN")
        self.args.force = True
        with self.wrong_collation_create_sql(), self.assertRaises(SystemExit):
            build_db.prepare_database(self.args)
        self.assertIsNone(self.exists())

    def test_existing_database_with_other_collation_is_rejected(self):
        self.create_with_icu_locale("en-US")
        with self.assertRaises(SystemExit) as raised:
            build_db.prepare_database(self.args)
        self.assertIn("--force", str(raised.exception))
        self.assertEqual(self.collation(), ("i", "en-US"))

    def test_sync_rejects_other_collation(self):
        self.create_with_icu_locale("en-US")
        with self.assertRaises(SystemExit) as raised:
            build_db.require_matching_mark(self.args)
        self.assertIn("collation", str(raised.exception))


class SeedSecretsTest(unittest.TestCase):
    def setUp(self):
        self.args = Namespace(
            host=os.environ.get("DB_HOST", "localhost"), port=os.environ.get("DB_PORT", "5432"),
            user=os.environ.get("DB_USER", "postgres"), dbname="build_db_seed_test_" + uuid.uuid4().hex[:10],
            force=False, if_empty=False, seed=True, demo_data=False,
        )

    def tearDown(self):
        with build_db.connect(self.args, "postgres", autocommit=True) as conn:
            conn.execute(sql.SQL("DROP DATABASE IF EXISTS {} WITH (FORCE)").format(sql.Identifier(self.args.dbname)))

    def exists(self):
        with build_db.connect(self.args, "postgres", autocommit=True) as conn:
            return conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", [self.args.dbname]).fetchone()

    def test_seed_missing_admin_password_exits_before_creating_or_deleting_database(self):
        """Edge case 8: build_db.py --seed thiếu ADMIN_PASSWORD: thoát lỗi, DB đích không bị tạo hay xoá."""
        env = os.environ.copy()
        env.pop("ADMIN_PASSWORD", None)
        env.pop("DEMO_PASSWORD", None)
        with mock.patch.dict(os.environ, env, clear=True):
            with self.assertRaises(SystemExit) as raised:
                build_db.require_seed_secrets(self.args)
            self.assertIn("ADMIN_PASSWORD", str(raised.exception))
            self.assertIsNone(self.exists())

        env_blank = env.copy()
        env_blank["ADMIN_PASSWORD"] = "   "
        with mock.patch.dict(os.environ, env_blank, clear=True):
            with self.assertRaises(SystemExit) as raised:
                build_db.require_seed_secrets(self.args)
            self.assertIn("ADMIN_PASSWORD", str(raised.exception))
            self.assertIsNone(self.exists())

        # Tạo DB sẵn, test với --force
        with build_db.connect(self.args, "postgres", autocommit=True) as conn:
            conn.execute(sql.SQL("CREATE DATABASE {} TEMPLATE template0 ENCODING 'UTF8'").format(sql.Identifier(self.args.dbname)))
        self.assertIsNotNone(self.exists())

        self.args.force = True
        with mock.patch.dict(os.environ, env, clear=True):
            with self.assertRaises(SystemExit) as raised:
                build_db.require_seed_secrets(self.args)
            self.assertIn("ADMIN_PASSWORD", str(raised.exception))
            self.assertIsNotNone(self.exists())

    def test_demo_data_missing_demo_password_exits_before_creating_database(self):
        self.args.demo_data = True
        env = os.environ.copy()
        env["ADMIN_PASSWORD"] = "valid_admin_pass"
        env.pop("DEMO_PASSWORD", None)
        with mock.patch.dict(os.environ, env, clear=True):
            with self.assertRaises(SystemExit) as raised:
                build_db.require_seed_secrets(self.args)
            self.assertIn("DEMO_PASSWORD", str(raised.exception))
            self.assertIsNone(self.exists())


if __name__ == "__main__":
    unittest.main()
