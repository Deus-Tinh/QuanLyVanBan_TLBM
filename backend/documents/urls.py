from django.urls import path
from . import views

app_name = 'documents'

urlpatterns = [
    path('incoming/', views.incoming_list, name='incoming_list'),
    path('outgoing/', views.outgoing_list, name='outgoing_list'),
    path('confidential/', views.confidential_list, name='confidential_list'),
]
