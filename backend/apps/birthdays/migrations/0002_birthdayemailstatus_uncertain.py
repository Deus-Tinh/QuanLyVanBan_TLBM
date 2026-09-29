from django.db import migrations, models


def backfill_birthday_year(apps, schema_editor):
    EmailLog = apps.get_model("birthdays", "BirthdayEmailLog")
    priority = {
        "SUCCESS": 5,
        "UNCERTAIN": 4,
        "PROCESSING": 3,
        "FAILED": 2,
        "PENDING": 1,
        "SKIPPED": 0,
    }
    selected = {}
    for log in EmailLog.objects.all().iterator():
        key = (log.staff_id, log.sent_date.year)
        previous = selected.get(key)
        if previous is None or (priority.get(log.status, 0), log.sent_date, log.pk) > (
            priority.get(previous.status, 0), previous.sent_date, previous.pk
        ):
            selected[key] = log

    # Keep every legacy audit row. If older code sent more than once in a year,
    # only the most conservative row receives the new period key.
    for (staff_id, year), log in selected.items():
        EmailLog.objects.filter(pk=log.pk).update(birthday_year=year)


class Migration(migrations.Migration):
    dependencies = [
        ("birthdays", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="birthdayemaillog",
            name="status",
            field=models.CharField(
                choices=[
                    ("PENDING", "Chờ xử lý"),
                    ("PROCESSING", "Đang xử lý"),
                    ("SUCCESS", "Gửi thành công"),
                    ("FAILED", "Thất bại"),
                    ("UNCERTAIN", "Cần đối soát trạng thái gửi"),
                    ("SKIPPED", "Bỏ qua"),
                ],
                default="PENDING",
                max_length=20,
                verbose_name="Trạng thái gửi",
            ),
        ),
        migrations.AddField(
            model_name="birthdayemaillog",
            name="birthday_year",
            field=models.PositiveSmallIntegerField(
                blank=True,
                help_text="Khoá chống gửi trùng trong cùng một năm dương lịch.",
                null=True,
                verbose_name="Năm sinh nhật",
            ),
        ),
        migrations.AddField(
            model_name="birthdayemaillog",
            name="reconciliation_note",
            field=models.TextField(blank=True, default="", verbose_name="Bằng chứng đối soát SMTP"),
        ),
        migrations.AddField(
            model_name="birthdayemaillog",
            name="reconciled_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="Thời điểm đối soát"),
        ),
        migrations.RunPython(backfill_birthday_year, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="birthdayemaillog",
            constraint=models.UniqueConstraint(
                fields=("staff", "birthday_year"),
                name="unique_birthday_email_per_year",
            ),
        ),
    ]
