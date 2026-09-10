from django.contrib import admin
from .models import VanBanDen, VanBanDi, VanBanMat

@admin.register(VanBanDen)
class VanBanDenAdmin(admin.ModelAdmin):
    list_display = ('code', 'doc_number', 'doc_date', 'sender', 'status')
    list_filter = ('status', 'doc_date')
    search_fields = ('code', 'summary', 'sender')

@admin.register(VanBanDi)
class VanBanDiAdmin(admin.ModelAdmin):
    list_display = ('code', 'doc_date', 'receiver', 'signer', 'status')
    search_fields = ('code', 'summary', 'receiver')

@admin.register(VanBanMat)
class VanBanMatAdmin(admin.ModelAdmin):
    list_display = ('code', 'security_level', 'signer', 'created_at')
    list_filter = ('security_level',)
