from django.db import models

class Department(models.Model):
    code = models.CharField(max_length=20, unique=True, verbose_name='Mã phòng ban')
    name = models.CharField(max_length=150, verbose_name='Tên phòng ban')

    class Meta:
        verbose_name = 'Đơn vị / Phòng ban'
        verbose_name_plural = 'Danh mục Đơn vị / Phòng ban'

    def __str__(self):
        return f"{self.code} - {self.name}"


class StaffBirthday(models.Model):
    name = models.CharField(max_length=150, verbose_name='Họ và tên')
    role = models.CharField(max_length=150, verbose_name='Chức danh / Nhóm')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Phòng ban')
    dept_code = models.CharField(max_length=20, blank=True, default='HT', verbose_name='Mã phòng ban rút gọn')
    dept_name = models.CharField(max_length=150, blank=True, default='Ban CNTT', verbose_name='Tên khối phòng ban')
    email = models.EmailField(verbose_name='Hộp thư điện tử')
    bday_day = models.PositiveSmallIntegerField(verbose_name='Ngày sinh')
    bday_month = models.PositiveSmallIntegerField(verbose_name='Tháng sinh')
    bday_year = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name='Năm sinh')
    sent = models.BooleanField(default=False, verbose_name='Đã gửi thiệp')
    sent_time = models.CharField(max_length=50, null=True, blank=True, verbose_name='Thời gian gửi thiệp (HH:mm:ss DD/MM/YYYY)')
    avatar = models.CharField(max_length=10, default='👨‍💼', verbose_name='Biểu tượng Avatar')

    class Meta:
        verbose_name = 'Sinh nhật CBNV'
        verbose_name_plural = 'Danh sách Sinh nhật CBNV'
        ordering = ['bday_month', 'bday_day']

    def __str__(self):
        return f"{self.name} ({self.bday_day:02d}/{self.bday_month:02d})"


class GreetingCardLog(models.Model):
    staff = models.ForeignKey(StaffBirthday, on_delete=models.CASCADE, related_name='greeting_logs', verbose_name='CBNV nhận')
    sender = models.CharField(max_length=150, default='Ban Tổng Giám đốc & Công đoàn TLBM', verbose_name='Đại diện gửi')
    wish_message = models.TextField(verbose_name='Lời chúc mừng')
    sent_at = models.DateTimeField(auto_now_add=True, verbose_name='Thời điểm gửi')

    class Meta:
        verbose_name = 'Nhật ký gửi thiệp'
        verbose_name_plural = 'Nhật ký gửi thiệp'


class CronScheduleConfig(models.Model):
    schedule_time = models.CharField(max_length=10, default='08:00', verbose_name='Giờ phát tự động')
    is_active = models.BooleanField(default=True, verbose_name='Kích hoạt dịch vụ Cron')
    email_subject = models.CharField(max_length=255, default='Chúc mừng sinh nhật CBNV TLBM', verbose_name='Tiêu đề Email')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Cập nhật lần cuối')

    class Meta:
        verbose_name = 'Cấu hình lịch phát tự động'
        verbose_name_plural = 'Cấu hình lịch phát tự động'
