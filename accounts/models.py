from __future__ import annotations
import random
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class UserManager(BaseUserManager):
    def normalize_phone(self, phone: str) -> str:
        # Nettoyage strict du téléphone pour le Sénégal (+221, espaces, etc.)
        phone = str(phone).strip().replace(" ", "").replace("-", "")
        if phone.startswith("00"):
            phone = "+" + phone[2:]
        return phone

    def create_user(self, phone: str, password=None, **extra_fields):
        if not phone:
            raise ValueError("Le numéro de téléphone est obligatoire.")
        phone = self.normalize_phone(phone)

        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, phone: str, password: str, **extra_fields):
        extra_fields.setdefault("role", "ADMIN")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CLIENT = "CLIENT", "Client / Particulier"
        PRO = "PRO", "Professionnel / Prestataire"
        ADMIN = "ADMIN", "Administrateur"

    phone = models.CharField(max_length=32, unique=True, verbose_name="Téléphone")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CLIENT)

    # Sécurité spécifique au cahier des charges
    whatsapp_verified = models.BooleanField(default=False, verbose_name="WhatsApp Vérifié")

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []

    @property
    def is_pro(self) -> bool:
        return self.role == self.Role.PRO

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN

    def __str__(self) -> str:
        return f"{self.phone} [{self.role}]"


class WhatsAppOTP(models.Model):
    """
    Gère les codes de vérification envoyés par WhatsApp.
    """
    phone = models.CharField(max_length=32, db_index=True)
    code = models.CharField(max_length=6)  # 6 chiffres est le standard

    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=3)  # Réduit pour plus de sécurité

    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = "OTP WhatsApp"
        indexes = [
            models.Index(fields=["phone", "expires_at"]),
        ]

    def is_valid(self) -> bool:
        now = timezone.now()
        return not self.is_expired() and not self.is_locked()

    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def is_locked(self) -> bool:
        return bool(self.locked_until and timezone.now() < self.locked_until)

    def check_code(self, input_code: str) -> bool:
        """Vérifie le code et gère le verrouillage en cas d'erreur."""
        if self.is_locked() or self.is_expired():
            return False

        if self.code == input_code:
            return True

        self.attempts += 1
        if self.attempts >= self.max_attempts:
            # Verrouille le numéro pendant 15 minutes après 3 échecs
            self.locked_until = timezone.now() + timedelta(minutes=15)
        self.save()
        return False