"""
Đổi các cột số nguyên tạm `don_vi_ap_dung_id`, `don_vi_id`, `chuc_vu_id` sang khóa ngoại tới bảng của Nhóm 7
(`organizations_donvi`, `accounts_position`) theo release_DDL.sql. Giữ nguyên tên cột và dữ liệu:
- trạng thái model: bỏ field số nguyên, thêm field ForeignKey cùng tên cột (thuộc tính `*_id` giữ nguyên);
- CSDL: AlterField trên đúng cột đó, chỉ thêm ràng buộc FK (và index với `don_vi_ap_dung_id`, như DDL).
DB dựng từ DDL đã có sẵn các FK này: chạy `migrate signing 0010 --fake`.
Trước khi thêm FK, kiểm giá trị không tồn tại ở bảng đích để báo lỗi rõ thay vì lỗi ràng buộc.
"""

import django.db.models.deletion
from django.db import migrations, models

# (model, field mới, cột, model đích, on_delete, db_index)
COT = [
    ("signingprocess", "don_vi_ap_dung", "don_vi_ap_dung_id", "organizations.donvi",
     django.db.models.deletion.PROTECT, True),
    ("signingprocessstep", "don_vi", "don_vi_id", "organizations.donvi",
     django.db.models.deletion.SET_NULL, False),
    ("signingprocessstepsigner", "chuc_vu", "chuc_vu_id", "accounts.position",
     django.db.models.deletion.PROTECT, False),
    ("signingrequeststepsigner", "chuc_vu", "chuc_vu_id", "accounts.position",
     django.db.models.deletion.SET_NULL, False),
]


def kiem_tra_gia_tri(apps, schema_editor):
    loi = []
    for model, _, cot, dich, _, _ in COT:
        nguon = apps.get_model("signing", model)
        bang_dich = apps.get_model(*dich.split("."))
        co = set(nguon.objects.exclude(**{f"{cot}__isnull": True}).values_list(cot, flat=True))
        thieu = co - set(bang_dich.objects.filter(pk__in=co).values_list("pk", flat=True))
        if thieu:
            loi.append(f"{nguon._meta.db_table}.{cot}: {sorted(thieu)[:10]}")
    if loi:
        raise RuntimeError("Giá trị không có ở bảng đích, cần sửa dữ liệu trước khi thêm FK: " + "; ".join(loi))


def _fk(dich, on_delete, db_index, **kwargs):
    return models.ForeignKey(dich, null=True, blank=True, on_delete=on_delete, related_name="+",
                             db_index=db_index, **kwargs)


class Migration(migrations.Migration):

    dependencies = [
        ("signing", "0009_doi_ten_cot_theo_ddl_chuan_hoa"),
        ("accounts", "0002_position_import_permission"),
        ("organizations", "0003_remove_donvi_created_at_remove_donvi_updated_at_and_more"),
    ]

    operations = [
        migrations.RunPython(kiem_tra_gia_tri, migrations.RunPython.noop),
        *[
            migrations.SeparateDatabaseAndState(
                database_operations=[
                    migrations.AlterField(model_name=model, name=cot,
                                          field=_fk(dich, on_delete, db_index, db_column=cot)),
                ],
                state_operations=[
                    migrations.RemoveField(model_name=model, name=cot),
                    migrations.AddField(model_name=model, name=ten, field=_fk(dich, on_delete, db_index)),
                ],
            )
            for model, ten, cot, dich, on_delete, db_index in COT
        ],
    ]
