"""Execute the production metadata SQL with a portable fixture database.
PostgreSQL enum, FK and WORM guards are covered by the release smoke command.
"""
import sqlite3
from contextlib import nullcontext
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch
from records.document_queries import query_dossier_documents, DocumentDataUnavailable


class Cursor:
    def __init__(self, db): self.raw = db.cursor()
    def __enter__(self): return self
    def __exit__(self, *args): self.raw.close()
    def execute(self, sql, params=()): return self.raw.execute(sql.replace('%s', '?'), params)
    def executemany(self, sql, params): return self.raw.executemany(sql.replace('%s', '?'), params)
    def fetchone(self): return self.raw.fetchone()
    def fetchall(self): return self.raw.fetchall()
    @property
    def description(self): return self.raw.description


class QueryReleaseTests(TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.execute('CREATE TABLE documents_access_log (document_type TEXT, document_id INTEGER, user_id INTEGER, hanh_dong TEXT)')
        for kind,date,link in [('vanbanden','ngay_den','vanbanden_id'),('vanbandi','ngay_ban_hanh','vanbandi_id')]:
            self.db.execute(f'CREATE TABLE documents_{kind} (id INTEGER PRIMARY KEY, so_hieu TEXT, trich_yeu TEXT, ngay_van_ban TEXT, {date} TEXT, nam INTEGER, pham_vi TEXT, nguoi_tao_id INTEGER, hien_thi BOOLEAN)')
            self.db.execute(f'CREATE TABLE documents_{kind}_hoso ({link} INTEGER, hoso_id INTEGER)')
            self.db.execute(f'CREATE TABLE documents_{kind}_nguoinhan ({link} INTEGER, employee_id INTEGER)')
            for id,scope,visible in [(1,'NOI_BO',1),(2,'HAN_CHE',1),(3,'NOI_BO',0)]:
                self.db.execute(f'INSERT INTO documents_{kind} VALUES (?,?,?,?,?,?,?,?,?)',(id,f'{kind}/{id}','metadata','2026-10-08','2026-10-08',2026,scope,11,visible))
                self.db.execute(f'INSERT INTO documents_{kind}_hoso VALUES (?,?)',(id,7))
            self.db.execute(f'INSERT INTO documents_{kind}_nguoinhan VALUES (2,22)')
        names=lambda:[row[0] for row in self.db.execute("SELECT name FROM sqlite_master WHERE type='table'")]
        columns=lambda cursor,table:[SimpleNamespace(name=row[1]) for row in self.db.execute(f'PRAGMA table_info({table})')]
        self.connection=SimpleNamespace(cursor=lambda:Cursor(self.db),introspection=SimpleNamespace(table_names=names,get_table_description=columns))
        self.patch_db=patch('records.document_queries.connection',self.connection);self.patch_db.start()
        self.patch_tx=patch('records.document_queries.transaction.atomic',lambda:nullcontext());self.patch_tx.start()
        self.addCleanup(self.patch_db.stop);self.addCleanup(self.patch_tx.stop);self.addCleanup(self.db.close)
    def actor(self,id=33,privileged=False,active=True):
        return SimpleNamespace(pk=id,is_authenticated=True,is_active=active,is_staff=privileged,is_superuser=privileged,don_vi_id=1,has_perm=lambda perm:privileged)
    def query(self,actor=None,**filters):
        return query_dossier_documents(dossier_id=7,user=actor or self.actor(),**filters)
    def test_creator_sees_restricted_rows(self): self.assertEqual(self.query(self.actor(11))[0],4)
    def test_named_recipient_sees_restricted_rows(self): self.assertEqual(self.query(self.actor(22))[0],4)
    def test_unrelated_superuser_has_no_restricted_override(self):
        count,rows=self.query(self.actor(33,True));self.assertEqual(count,4);self.assertTrue(all(r['pham_vi']=='NOI_BO' for r in rows))
    def test_department_membership_is_not_an_employee_recipient(self): self.assertEqual(self.query()[0],2)
    def test_inactive_actor_reads_nothing(self): self.assertEqual(self.query(self.actor(11,True,False)),(0,[]))
    def test_counts_and_pages_are_scoped_before_pagination(self):
        count,rows=self.query(page=2,page_size=1);self.assertEqual((count,len(rows)),(2,1));self.assertEqual(rows[0]['pham_vi'],'NOI_BO')
    def test_scope_kind_year_and_search_combine(self):
        count,rows=self.query(self.actor(22),scope='HAN_CHE',document_type='vanbandi',year=2026,search='metadata');self.assertEqual(count,1);self.assertEqual(rows[0]['key'],'vanbandi:2')
    def test_search_does_not_reveal_hidden_restricted_record(self): self.assertEqual(self.query(search='vanbanden/2')[0],0)
    def test_sql_injection_is_only_a_search_value(self): self.assertEqual(self.query(search="' OR 1=1 --")[0],0)
    def test_each_returned_metadata_row_is_audited(self):
        count,rows=self.query(self.actor(11),page_size=1);logs=self.db.execute('SELECT document_type,document_id,user_id,hanh_dong FROM documents_access_log').fetchall();self.assertEqual(logs,[(rows[0]['document_type'],rows[0]['id'],11,'XEM')]);self.assertEqual(count,4)
    def test_removed_kind_and_unknown_scope_rejected(self):
        for filters in [{'document_type':'vanbanmat'},{'scope':'OTHER'},{'page':0}]:
            with self.subTest(filters=filters),self.assertRaises(ValueError):self.query(**filters)
    def test_old_column_schema_is_rejected(self):
        self.connection.introspection.get_table_description=lambda *args:[]
        with self.assertRaises(DocumentDataUnavailable):self.query()
    def test_missing_audit_table_is_rejected(self):
        self.db.execute('DROP TABLE documents_access_log')
        with self.assertRaises(DocumentDataUnavailable):self.query()
