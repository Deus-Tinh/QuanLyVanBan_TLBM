import re

from django.core.exceptions import ValidationError
from django.db import models


class KhoiKhuVuc(models.Model):
    """
    Tier 1: Region / Block.
    """
    ten = models.CharField(
        max_length=255,
        unique=True,
        verbose_name="organizations.region.nameLabel",
    )

    thu_tu_hien_thi = models.PositiveIntegerField(
        default=0,
        verbose_name="organizations.region.displayOrderLabel",
        help_text="organizations.region.displayOrderHelp",
    )

    class Meta:
        db_table = "organizations_khoi"
        app_label = "organizations"
        verbose_name = "organizations.tabs.regions"
        verbose_name_plural = "organizations.tabs.regions"
        ordering = ["thu_tu_hien_thi", "ten"]

    def clean(self):
        super().clean()
        self.ten = self.ten.strip()
        if not self.ten:
            raise ValidationError({"ten": "organizations.messages.nameRequired"})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.ten


class DonVi(models.Model):
    """
    Tier 2: Unit / Department.
    """
    khoi = models.ForeignKey(
        KhoiKhuVuc,
        on_delete=models.PROTECT,
        related_name="don_vi_list",
        verbose_name="organizations.unit.regionLabel",
    )
    stt_uu_tien = models.PositiveIntegerField(
        unique=True,
        verbose_name="organizations.unit.priorityLabel",
        help_text="organizations.unit.priorityHelp",
    )
    ten = models.CharField(
        max_length=255,
        verbose_name="organizations.unit.nameLabel",
    )
    dia_chi = models.TextField(
        blank=True,
        default="",
        verbose_name="organizations.unit.addressLabel",
    )
    dien_thoai = models.CharField(
        max_length=20,
        blank=True,
        default="",
        verbose_name="organizations.unit.phoneLabel",
    )
    email = models.EmailField(
        blank=True,
        default="",
        verbose_name="organizations.unit.emailLabel",
    )
    is_public = models.BooleanField(
        default=True,
        verbose_name="organizations.unit.isPublicLabel",
        help_text="organizations.unit.isPublicHelp",
    )
    ghi_chu = models.TextField(
        blank=True,
        default="",
        verbose_name="organizations.unit.notesLabel",
    )

    class Meta:
        db_table = "organizations_donvi"
        app_label = "organizations"
        verbose_name = "organizations.tabs.units"
        verbose_name_plural = "organizations.tabs.units"
        ordering = ["stt_uu_tien", "ten"]
        permissions = [
            ("export_donvi", "organizations.unit.exportPermission"),
        ]

    def clean(self):
        super().clean()
        errors = {}

        self.ten = self.ten.strip()
        if not self.ten:
            errors["ten"] = "organizations.messages.nameRequired"

        if self.stt_uu_tien is not None and self.stt_uu_tien <= 0:
            errors["stt_uu_tien"] = "organizations.messages.priorityPositive"

        if self.dien_thoai:
            phone = re.sub(r"[\s.-]", "", self.dien_thoai)
            if not re.fullmatch(r"0[235789]\d{8,9}", phone):
                errors["dien_thoai"] = "organizations.messages.phoneInvalid"

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ten} ({self.khoi.ten})"
