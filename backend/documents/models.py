from django.db import models

class VanBanDen(models.Model):
    code = models.CharField(max_length=100, verbose_name='Số, ký hiệu văn bản')
    doc_number = models.PositiveIntegerField(verbose_name='Số đến')
    doc_date = models.DateField(verbose_name='Ngày văn bản')
    arrival_date = models.DateTimeField(verbose_name='Ngày đến (HH:mm:ss DD/MM/YYYY)')
    summary = models.TextField(verbose_name='Trích yếu nội dung')
    sender = models.CharField(max_length=255, verbose_name='Nơi ban hành / Người gửi')
    STATUS_CHOICES = [
        ('valid', 'Còn hiệu lực'),
        ('expired', 'Hết hiệu lực'),
        ('replaced', 'Hết hiệu lực & thay thế'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='valid', verbose_name='Hiệu lực')

    class Meta:
        verbose_name = 'Văn bản đến'
        verbose_name_plural = 'Danh sách Văn bản đến'
        ordering = ['-doc_date']

    def __str__(self):
        return f"{self.code} - {self.summary[:50]}"


class VanBanDi(models.Model):
    code = models.CharField(max_length=100, verbose_name='Số, ký hiệu văn bản đi')
    doc_date = models.DateTimeField(verbose_name='Ngày ban hành (HH:mm:ss DD/MM/YYYY)')
    summary = models.TextField(verbose_name='Trích yếu nội dung')
    receiver = models.CharField(max_length=255, verbose_name='Nơi nhận')
    signer = models.CharField(max_length=150, verbose_name='Người ký duyệt')
    status = models.CharField(max_length=50, default='Đã ký số', verbose_name='Trạng thái ban hành')

    class Meta:
        verbose_name = 'Văn bản đi'
        verbose_name_plural = 'Danh sách Văn bản đi'
        ordering = ['-doc_date']

    def __str__(self):
        return f"{self.code} - {self.summary[:50]}"


class VanBanMat(models.Model):
    code = models.CharField(max_length=100, verbose_name='Số, ký hiệu văn bản mật')
    SECURITY_CHOICES = [
        ('mat', 'Mật'),
        ('toimat', 'Tối mật'),
        ('tuyetmat', 'Tuyệt mật'),
        ('hoatoc', 'Hỏa tốc'),
    ]
    security_level = models.CharField(max_length=20, choices=SECURITY_CHOICES, default='mat', verbose_name='Cấp độ bảo mật')
    summary = models.TextField(verbose_name='Trích yếu nội dung')
    signer = models.CharField(max_length=150, verbose_name='Người ký duyệt')
    created_at = models.DateTimeField(verbose_name='Thời gian tiếp nhận (HH:mm:ss DD/MM/YYYY)')

    class Meta:
        verbose_name = 'Văn bản mật'
        verbose_name_plural = 'Danh sách Văn bản mật & khẩn'

    def __str__(self):
        return f"[{self.get_security_level_display()}] {self.code}"
