from django.db import migrations


WISH_SQL = (
    '-- Nạp 16 lời chúc sinh nhật mẫu.\n'
    'INSERT INTO birthdays_birthdaywish (\n'
    '    employee_id, sender_name, message, card_template, is_anonymous, trang_thai\n'
    ')\n'
    'SELECT\n'
    '    employee.id,\n'
    '    source.sender_name,\n'
    '    source.message,\n'
    '    source.card_template,\n'
    '    source.is_anonymous,\n'
    '    source.trang_thai::birthdaywish_status\n'
    'FROM (\n'
    '    VALUES\n'
    "    ('hanhlb2', 'hanhlb2@example.com', 'Huỳnh Thu Quỳnh', 'Chúc mừng sinh nhật, chúc mọi điều tốt đẹp!', 'GOLDEN', FALSE, 'APPROVED'),\n"
    "    ('hungnt', 'hungnt@example.com', 'Huỳnh Kim Phương', 'Chúc anh/chị sinh nhật vui vẻ, nhiều sức khỏe!', 'GOLDEN', FALSE, 'APPROVED'),\n"
    "    ('chautk', 'chautk@example.com', 'Phan Tuấn Hải', 'Chúc anh/chị sinh nhật vui vẻ, nhiều sức khỏe!', 'GOLDEN', FALSE, 'APPROVED'),\n"
    "    ('oanhtk', 'oanhtk@example.com', 'Ẩn danh', 'Chúc sinh nhật ấm áp bên gia đình và đồng nghiệp.', 'GOLDEN', TRUE, 'APPROVED'),\n"
    "    ('thangtg', 'thangtg@example.com', 'Trần Khánh Thảo', 'Chúc mừng sinh nhật, chúc mọi điều tốt đẹp!', 'GOLDEN', FALSE, 'APPROVED'),\n"
    "    ('thangtt2', 'thangtt2@example.com', 'Hoàng Bảo Hà', 'Chúc anh/chị sinh nhật vui vẻ, nhiều sức khỏe!', 'GOLDEN', FALSE, 'PENDING'),\n"
    "    ('dunglk', 'dunglk@example.com', 'Huỳnh Thị Nga', 'Chúc mừng sinh nhật, chúc mọi điều tốt đẹp!', 'GOLDEN', FALSE, 'APPROVED'),\n"
    "    ('datnm', 'datnm@example.com', 'Bùi Diệu Nga', 'Happy birthday! Chúc một năm làm việc hiệu quả.', 'GOLDEN', FALSE, 'APPROVED'),\n"
    "    ('hanhlb2', 'hanhlb2@example.com', 'Hoàng Kim Mai', 'Happy birthday! Chúc một năm làm việc hiệu quả.', 'GOLDEN', FALSE, 'APPROVED'),\n"
    "    ('hungnt', 'hungnt@example.com', 'Ngô Diệu Lan', 'Chúc sinh nhật ấm áp bên gia đình và đồng nghiệp.', 'GOLDEN', FALSE, 'REJECTED'),\n"
    "    ('chautk', 'chautk@example.com', 'Ẩn danh', 'Chúc mừng sinh nhật, chúc mọi điều tốt đẹp!', 'GOLDEN', TRUE, 'APPROVED'),\n"
    "    ('oanhtk', 'oanhtk@example.com', 'Bùi Thành Vinh', 'Happy birthday! Chúc một năm làm việc hiệu quả.', 'GOLDEN', FALSE, 'PENDING'),\n"
    "    ('thangtg', 'thangtg@example.com', 'Đặng Bảo Hương', 'Chúc tuổi mới thành công và hạnh phúc!', 'GOLDEN', FALSE, 'APPROVED'),\n"
    "    ('thangtt2', 'thangtt2@example.com', 'Phạm Tuấn Tài', 'Chúc mừng sinh nhật, chúc mọi điều tốt đẹp!', 'GOLDEN', FALSE, 'APPROVED'),\n"
    "    ('dunglk', 'dunglk@example.com', 'Võ Đức An', 'Chúc anh/chị sinh nhật vui vẻ, nhiều sức khỏe!', 'GOLDEN', FALSE, 'APPROVED'),\n"
    "    ('datnm', 'datnm@example.com', 'Trần Quốc Đạt', 'Chúc mừng sinh nhật, chúc mọi điều tốt đẹp!', 'GOLDEN', FALSE, 'APPROVED')\n"
    ') AS source (username, email, sender_name, message, card_template, is_anonymous, trang_thai)\n'
    'JOIN accounts_employee employee\n'
    '    ON employee.username = source.username AND employee.email = source.email\n'
    'WHERE NOT EXISTS (\n'
    '    SELECT 1\n'
    '    FROM birthdays_birthdaywish existing\n'
    '    WHERE existing.employee_id = employee.id\n'
    '      AND existing.sender_name = source.sender_name\n'
    '      AND existing.message = source.message\n'
    ');'
)

class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0012_import_sample_employees"),
        ("birthdays", "0004_install_updated_at_triggers"),
    ]

    operations = [migrations.RunSQL(WISH_SQL, migrations.RunSQL.noop)]
