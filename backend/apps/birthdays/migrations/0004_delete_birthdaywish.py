from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("birthdays", "0003_birthdayemaillog_attempt_id_and_more"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(
                    name="BirthdayWish",
                ),
            ],
            database_operations=[],
        ),
    ]
