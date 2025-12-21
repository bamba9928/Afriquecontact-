from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class Payment(models.Model):
    class Provider(models.TextChoices):
        BICTORYS = "BICTORYS", "Bictorys"

    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        PAID = "PAID", "Payé"
        FAILED = "FAILED", "Échoué"
        CANCELED = "CANCELED", "Annulé"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="payments", on_delete=models.CASCADE)
    provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.BICTORYS)

    # IMPORTANT: on l'utilise comme référence interne (et on l'envoie au provider)
    provider_ref = models.CharField(max_length=120, unique=True, db_index=True)

    amount = models.PositiveIntegerField(default=1000)
    currency = models.CharField(max_length=8, default="XOF")

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payload = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["provider", "status"]),
            models.Index(fields=["created_at"]),
        ]

    def mark_paid(self):
        self.status = self.Status.PAID
        self.paid_at = timezone.now()
        self.save(update_fields=["status", "paid_at"])

    def __str__(self) -> str:
        return f"{self.user_id} {self.provider} {self.status} {self.amount}{self.currency}"


class Subscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        EXPIRED = "EXPIRED", "Expirée"
        CANCELED = "CANCELED", "Annulée"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="subscriptions", on_delete=models.CASCADE)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.EXPIRED)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)

    last_payment = models.ForeignKey(Payment, null=True, blank=True, on_delete=models.SET_NULL)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["end_at"]),
        ]

    def is_active(self) -> bool:
        if self.status != self.Status.ACTIVE:
            return False
        if not self.end_at:
            return True
        return timezone.now() < self.end_at

    def __str__(self) -> str:
        return f"Subscription({self.user_id}, {self.status})"
