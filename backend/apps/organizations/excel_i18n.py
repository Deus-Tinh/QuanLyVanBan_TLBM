EXCEL_TRANSLATIONS = {
    "vi": {
        "organizations.export.sheetTitle": "Danh Sách Đơn Vị",
        "organizations.export.filename": "danh_sach_don_vi_phong_ban.xlsx",
        "organizations.export.headers": [
            "STT Ưu Tiên",
            "Tên Đơn Vị / Phòng Ban",
            "Khối / Khu Vực Trực Thuộc",
            "Số Điện Thoại",
            "Email",
            "Địa Chỉ",
            "Trạng Thái",
            "Ghi Chú",
        ],
        "organizations.export.public": "Công khai",
        "organizations.export.internal": "Nội bộ",
    },
    "en": {
        "organizations.export.sheetTitle": "Departments Directory",
        "organizations.export.filename": "departments_directory.xlsx",
        "organizations.export.headers": [
            "Priority Index",
            "Unit / Department Name",
            "Parent Region / Block",
            "Phone Number",
            "Email",
            "Address",
            "Status",
            "Notes",
        ],
        "organizations.export.public": "Public",
        "organizations.export.internal": "Internal Only",
    },
}


def get_excel_translations(lang):
    selected = EXCEL_TRANSLATIONS.get(lang, EXCEL_TRANSLATIONS["vi"])
    return {
        "sheet_title": selected["organizations.export.sheetTitle"],
        "filename": selected["organizations.export.filename"],
        "headers": selected["organizations.export.headers"],
        "public": selected["organizations.export.public"],
        "internal": selected["organizations.export.internal"],
    }
