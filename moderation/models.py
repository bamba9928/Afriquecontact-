from __future__ import annotations
from django.conf import settings
from django.db import models
from pros.models import ProfessionalProfile


class Report(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Ouvert"
        RESOLVED = "RESOLVED", "Traité"
        REJECTED = "REJECTED", "Rejeté"

    class Reason(models.TextChoices):
        SPAM = "SPAM", "Spam / Pub"
        FAKE = "FAKE", "Faux profil"
        INAPPROPRIATE = "INAPPROPRIATE", "Contenu inapproprié"
        OTHER = "OTHER", "Autre"

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="reports", on_delete=models.CASCADE)
    professional = models.ForeignKey(ProfessionalProfile, related_name="reports", on_delete=models.CASCADE)

    reason = models.CharField(max_length=20, choices=Reason.choices)
    message = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name="reports_processed",
        on_delete=models.SET_NULL,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["professional"]),
        ]

    def __str__(self) -> str:
        return f"Report({self.professional_id}, {self.reason}, {self.status})"
