from django.urls import path
from . import views

app_name = "birthdays"

urlpatterns = [
    path("calendar/", views.calendar_api, name="calendar"),
    path("day/", views.day_birthdays_api, name="day_birthdays"),
    path("wishes/", views.birthday_wishes_api, name="wishes"),
    path("logs/", views.birthday_email_logs_api, name="logs"),
    path("trigger-job/", views.trigger_birthday_job_api, name="trigger_job"),
]
