-- =====================================================================
-- ROLLBACK MIGRATION SCRIPT: P0, P1, P2
-- Dự án: Hệ thống Quản lý Văn bản và Tài liệu (QLVB&TL)
-- Phục hồi lại trạng thái trước khi áp dụng Issue #47
-- =====================================================================

BEGIN;

-- P2: Drop indexes
DROP INDEX IF EXISTS idx_signing_request_hanchot;
DROP INDEX IF EXISTS idx_signing_request_step_hanxuly;

-- P1: Remove the 5 added permissions
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

-- P0: Drop P0 indexes
DROP INDEX IF EXISTS idx_signing_request_document;

-- P0: Restore original triggers if needed
DROP TRIGGER IF EXISTS trg_signing_signature_immutable ON signing_signature;
DROP TRIGGER IF EXISTS trg_signing_manifest_protect ON signing_manifest;
DROP TRIGGER IF EXISTS trg_signing_audit_log_immutable ON signing_audit_log;

COMMIT;
