from __future__ import annotations

from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class UserManager(BaseUserManager):
    def normalize_phone(self, phone: str) -> str:
        return str(phone).strip().replace(" ", "")

    def create_user(self, phone: str, password=None, **extra_fields):
        if not phone:
            raise ValueError("Le téléphone est obligatoire.")
        phone = self.normalize_phone(phone)

        extra_fields.setdefault("is_active", True)

        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone: str, password: str, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(phone=phone, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        PRO = "PRO", "Professionnel"
        ADMIN = "ADMIN", "Admin"

    phone = models.CharField(max_length=32, unique=True)
    email = models.EmailField(blank=True, null=True)

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CLIENT)
    whatsapp_verified = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []

    def __str__(self) -> str:
        return f"{self.phone} ({self.role})"


class WhatsAppOTP(models.Model):
    phone = models.CharField(max_length=32, db_index=True)
    code = models.CharField(max_length=10)

    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)

    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        indexes = [
            models.Index(fields=["phone", "expires_at"]),
        ]

    @classmethod
    def create_otp(cls, phone: str, code: str, ttl_minutes: int = 5) -> "WhatsAppOTP":
        return cls.objects.create(
            phone=phone,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=ttl_minutes),
        )

    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def is_locked(self) -> bool:
        return bool(self.locked_until and timezone.now() < self.locked_until)

    def __str__(self) -> str:
        return f"OTP({self.phone})"
