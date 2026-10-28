from django.db import migrations


ROOM_SQL = (
    '-- Nạp 8 phòng họp mẫu.\n'
    'INSERT INTO meetings_meetingroom (\n'
    '    name, location, capacity, amenities, is_public, trang_thai, ghi_chu\n'
    ')\n'
    'VALUES\n'
    "    ('Phòng họp lớn tầng 10', 'Trụ sở chính - Tầng 10', '40', 'Máy chiếu, Micro, Video conference', TRUE, 'AVAILABLE'::meetingroom_status, NULL),\n"
    "    ('Phòng họp HĐQT', 'Trụ sở chính - Tầng 12', '16', 'Màn hình 85 inch, Micro, Ghi âm', FALSE, 'AVAILABLE'::meetingroom_status, NULL),\n"
    "    ('Phòng họp Ban điều hành', 'Trụ sở chính - Tầng 11', '20', 'Màn hình, Video conference', TRUE, 'AVAILABLE'::meetingroom_status, NULL),\n"
    "    ('Phòng họp nhỏ A', 'Trụ sở chính - Tầng 8', '8', 'TV, Bảng trắng', TRUE, 'AVAILABLE'::meetingroom_status, NULL),\n"
    "    ('Phòng họp nhỏ B', 'Trụ sở chính - Tầng 8', '6', 'Bảng trắng', TRUE, 'MAINTENANCE'::meetingroom_status, NULL),\n"
    "    ('Phòng đào tạo', 'Trụ sở chính - Tầng 5', '60', 'Máy chiếu, Âm thanh, 60 ghế', TRUE, 'AVAILABLE'::meetingroom_status, NULL),\n"
    "    ('Phòng họp trực tuyến', 'Trụ sở chính - Tầng 9', '12', 'Video conference, Camera 4K', TRUE, 'AVAILABLE'::meetingroom_status, NULL),\n"
    "    ('Phòng họp chi nhánh Hà Nội', 'Bảo Long Hà Nội - Tầng 3', '15', 'Máy chiếu', TRUE, 'UNAVAILABLE'::meetingroom_status, NULL)\n"
    'ON CONFLICT (name) DO NOTHING;'
)

BOOKING_SQL = (
    '-- Nạp 36 lịch họp mẫu; bỏ qua bản trùng và khung giờ đã có người đặt.\n'
    'INSERT INTO meetings_meetingbooking (\n'
    '    room_id, organizer_id, department_id, title, date, start_time, end_time,\n'
    '    attendees_count, purpose, trang_thai\n'
    ')\n'
    'SELECT\n'
    '    room.id,\n'
    '    organizer.id,\n'
    '    department.id,\n'
    '    source.title,\n'
    '    source.meeting_date::date,\n'
    '    source.start_time::time,\n'
    '    source.end_time::time,\n'
    '    source.attendees_count::integer,\n'
    '    source.purpose,\n'
    '    source.trang_thai::meetingbooking_status\n'
    'FROM (\n'
    '    VALUES\n'
    "    ('Phòng họp HĐQT', 'ngank', 'ngank@example.com', 'Bảo Long Nam Sài Gòn', 'Họp dự án chuyển đổi số', '2026-10-12', '08:00:00', '09:30:00', '6', 'Nội dung mẫu phục vụ demo', 'CANCELLED'),\n"
    "    ('Phòng họp nhỏ A', 'namlc', 'namlc@example.com', 'Bảo Long Bến Thành', 'Họp dự án chuyển đổi số', '2026-10-12', '15:15:00', '16:45:00', '6', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),\n"
    "    ('Phòng họp Ban điều hành', 'mainb', 'mainb@example.com', 'Ban kế toán', 'Họp hội đồng thẩm định', '2026-10-13', '13:30:00', '15:00:00', '11', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),\n"
    "    ('Phòng họp lớn tầng 10', 'hanhtt', 'hanhtt@example.com', 'Bảo Long Thái Nguyên', 'Họp giao ban tuần', '2026-10-13', '15:15:00', '16:45:00', '38', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),\n"
    "    ('Phòng họp Ban điều hành', 'trunglt', 'trunglt@example.com', 'Ban dự án lớn', 'Họp triển khai kế hoạch quý', '2026-10-14', '09:45:00', '11:15:00', '12', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),\n"
    "    ('Phòng họp Ban điều hành', 'hieuvm', 'hieuvm@example.com', 'Ban khách hàng cá nhân', 'Họp tổng kết tháng', '2026-10-14', '15:15:00', '16:45:00', '15', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),\n"
    "    ('Phòng họp nhỏ A', 'tulc', 'tulc@example.com', 'Ban quản lý rủi ro và tuân thủ', 'Họp giao ban tuần', '2026-10-14', '15:15:00', '16:45:00', '8', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),\n"
    "    ('Phòng họp trực tuyến', 'nhungvn', 'nhungvn@example.com', 'Bảo Long KV Tây Nguyên (Daklak)', 'Trao đổi quy trình bồi thường', '2026-10-15', '15:15:00', '16:45:00', '12', 'Nội dung mẫu phục vụ demo', 'CANCELLED'),\n"
    "    ('Phòng họp trực tuyến', 'longhh2', 'longhh2@example.com', 'Bảo Long Đông Hải', 'Phỏng vấn tuyển dụng', '2026-10-19', '08:00:00', '09:30:00', '3', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),\n"
    "    ('Phòng họp trực tuyến', 'haivh2', 'haivh2@example.com', 'Bảo Long Bình Thuận', 'Trao đổi quy trình bồi thường', '2026-10-21', '13:30:00', '15:00:00', '5', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),\n"
    "    ('Phòng họp HĐQT', 'hungnt2', 'hungnt2@example.com', 'Bảo Long Vũng Tàu', 'Họp giao ban tuần', '2026-10-21', '15:15:00', '16:45:00', '5', 'Nội dung mẫu phục vụ demo', 'CANCELLED'),\n"
    "    ('Phòng họp lớn tầng 10', 'vypk', 'vypk@example.com', 'Ban dự án phát triển sản phẩm liên kết với các công ty dịch vụ viễn thông', 'Họp giao ban tuần', '2026-10-22', '08:00:00', '09:30:00', '40', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp HĐQT', 'thanglq', 'thanglq@example.com', 'Bảo Long Đông Hải', 'Họp tổng kết tháng', '2026-10-22', '09:45:00', '11:15:00', '13', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp trực tuyến', 'phuongvn', 'phuongvn@example.com', 'Ban khách hàng qua môi giới', 'Phỏng vấn tuyển dụng', '2026-10-22', '09:45:00', '11:15:00', '12', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp trực tuyến', 'dunglk', 'dunglk@example.com', 'Bảo Long Đà Nẵng', 'Trao đổi quy trình bồi thường', '2026-10-22', '15:15:00', '16:45:00', '7', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp nhỏ A', 'maidt', 'maidt@example.com', 'Bảo Long Tân Sơn Nhất', 'Họp giao ban tuần', '2026-10-23', '08:00:00', '09:30:00', '6', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp HĐQT', 'mydt', 'mydt@example.com', 'Bảo Long KV Tây Nguyên (Daklak)', 'Họp hội đồng thẩm định', '2026-10-23', '09:45:00', '11:15:00', '12', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp HĐQT', 'hungnv', 'hungnv@example.com', 'Ban dự án khách hàng qua đại lý', 'Rà soát hợp đồng bảo hiểm', '2026-10-23', '13:30:00', '15:00:00', '8', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng đào tạo', 'myvd', 'myvd@example.com', 'Trung tâm kinh doanh Sông Hàn', 'Họp tổng kết tháng', '2026-10-23', '13:30:00', '15:00:00', '24', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp lớn tầng 10', 'mydb', 'mydb@example.com', 'Bảo Long Thanh Hóa', 'Họp tổng kết tháng', '2026-10-26', '08:00:00', '09:30:00', '13', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp trực tuyến', 'phuongdb', 'phuongdb@example.com', 'Bảo Long Đà Nẵng', 'Đào tạo nghiệp vụ', '2026-10-26', '08:00:00', '09:30:00', '9', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp nhỏ A', 'cuongpc', 'cuongpc@example.com', 'Ban truyền thông và marketing', 'Phỏng vấn tuyển dụng', '2026-10-27', '09:45:00', '11:15:00', '8', 'Nội dung mẫu phục vụ demo', 'CANCELLED'),\n"
    "    ('Phòng họp HĐQT', 'dungdv3', 'dungdv3@example.com', 'Bảo Long Tây Ninh', 'Họp dự án chuyển đổi số', '2026-10-27', '15:15:00', '16:45:00', '6', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp lớn tầng 10', 'maivt', 'maivt@example.com', 'Ban tổng giám đốc', 'Rà soát hợp đồng bảo hiểm', '2026-10-27', '15:15:00', '16:45:00', '25', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp nhỏ A', 'anhlt', 'anhlt@example.com', 'Bảo Long Thủ Đô', 'Họp giao ban tuần', '2026-10-27', '15:15:00', '16:45:00', '3', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp lớn tầng 10', 'thangdt', 'thangdt@example.com', 'Bảo Long Long An', 'Họp triển khai kế hoạch quý', '2026-10-28', '13:30:00', '15:00:00', '39', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp lớn tầng 10', 'huongpd', 'huongpd@example.com', 'Giám đốc vùng', 'Họp với đối tác', '2026-10-28', '15:15:00', '16:45:00', '14', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp trực tuyến', 'dunglk', 'dunglk@example.com', 'Bảo Long Đà Nẵng', 'Trao đổi quy trình bồi thường', '2026-10-29', '09:45:00', '11:15:00', '8', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp lớn tầng 10', 'trunglh', 'trunglh@example.com', 'Bảo Long Cà Mau', 'Họp dự án chuyển đổi số', '2026-10-29', '15:15:00', '16:45:00', '5', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng đào tạo', 'huongvk', 'huongvk@example.com', 'Ban khách hàng qua môi giới', 'Họp tổng kết tháng', '2026-10-30', '13:30:00', '15:00:00', '49', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp HĐQT', 'anhnt', 'anhnt@example.com', 'Bảo Long Thủ Đô', 'Họp giao ban tuần', '2026-11-02', '13:30:00', '15:00:00', '5', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp Ban điều hành', 'anhdp', 'anhdp@example.com', 'Bảo Long Cà Mau', 'Họp tổng kết tháng', '2026-11-03', '13:30:00', '15:00:00', '10', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp nhỏ A', 'longdt', 'longdt@example.com', 'Bảo Long Đồng Tháp', 'Họp dự án chuyển đổi số', '2026-11-03', '13:30:00', '15:00:00', '2', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp lớn tầng 10', 'anhdk', 'anhdk@example.com', 'Bảo Long Bình Thuận', 'Phỏng vấn tuyển dụng', '2026-11-03', '15:15:00', '16:45:00', '5', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp Ban điều hành', 'demo_vt_2', 'demo_vt_2@example.com', 'Ban hành chính quản trị', 'Họp với đối tác', '2026-11-04', '13:30:00', '15:00:00', '14', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),\n"
    "    ('Phòng họp HĐQT', 'binhdd', 'binhdd@example.com', 'Hội đồng quản trị', 'Họp tổng kết tháng', '2026-11-04', '15:15:00', '16:45:00', '6', 'Nội dung mẫu phục vụ demo', 'CONFIRMED')\n"
    ') AS source (\n'
    '    room_name, username, email, department_name, title, meeting_date,\n'
    '    start_time, end_time, attendees_count, purpose, trang_thai\n'
    ')\n'
    'JOIN meetings_meetingroom room ON room.name = source.room_name\n'
    'JOIN accounts_employee organizer\n'
    '    ON organizer.username = source.username AND organizer.email = source.email\n'
    'LEFT JOIN organizations_donvi department ON department.ten = source.department_name\n'
    'WHERE (source.department_name IS NULL OR department.id IS NOT NULL)\n'
    '  AND NOT EXISTS (\n'
    '      SELECT 1\n'
    '      FROM meetings_meetingbooking existing\n'
    '      WHERE existing.room_id = room.id\n'
    '        AND existing.organizer_id = organizer.id\n'
    '        AND existing.date = source.meeting_date::date\n'
    '        AND existing.start_time = source.start_time::time\n'
    '        AND existing.end_time = source.end_time::time\n'
    '        AND existing.title = source.title\n'
    '  )\n'
    '  AND (\n'
    "      source.trang_thai = 'CANCELLED'\n"
    '      OR NOT EXISTS (\n'
    '          SELECT 1\n'
    '          FROM meetings_meetingbooking occupied\n'
    '          WHERE occupied.room_id = room.id\n'
    '            AND occupied.date = source.meeting_date::date\n'
    "            AND occupied.trang_thai <> 'CANCELLED'\n"
    '            AND occupied.start_time < source.end_time::time\n'
    '            AND source.start_time::time < occupied.end_time\n'
    '      )\n'
    '  );'
)

class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0012_import_sample_employees"),
        ("meetings", "0004_install_meetingroom_updated_at_trigger"),
        ("organizations", "0005_reference_data_ddl"),
    ]

    operations = [
        migrations.RunSQL(ROOM_SQL, migrations.RunSQL.noop),
        migrations.RunSQL(BOOKING_SQL, migrations.RunSQL.noop),
    ]
