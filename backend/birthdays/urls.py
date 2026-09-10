from django.urls import path
from . import views

app_name = 'birthdays'

urlpatterns = [
    path('', views.birthday_calendar, name='calendar'),
    path('send-wish/', views.api_send_wish, name='send_wish'),
    path('api/send-wish/', views.api_send_wish, name='api_send_wish'),
    path('api/save-config/', views.api_save_config, name='save_config'),
]
