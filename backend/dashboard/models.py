from django.db import models

class SystemAnnouncement(models.Model):
    title = models.CharField(max_length=255, verbose_name='Tiêu đề thông báo')
    content = models.TextField(verbose_name='Nội dung')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Thời gian tạo')
    is_active = models.BooleanField(default=True, verbose_name='Đang phát')

    class Meta:
        verbose_name = 'Thông báo hệ thống'
        verbose_name_plural = 'Thông báo hệ thống'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
