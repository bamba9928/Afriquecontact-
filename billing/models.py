from __future__ import annotations

from datetime import timedelta
from django.conf import settings
from django.db import models
from django.utils import timezone


class Payment(models.Model):
    """
    Trace de la transaction financière (E-commerce / Bictorys).
    """

    class Provider(models.TextChoices):
        BICTORYS = "BICTORYS", "Bictorys"

    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        PAID = "PAID", "Payé"
        FAILED = "FAILED", "Échoué"
        CANCELED = "CANCELED", "Annulé"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="payments",
        on_delete=models.CASCADE
    )
    provider = models.CharField(
        max_length=20,
        choices=Provider.choices,
        default=Provider.BICTORYS
    )

    # Référence externe renvoyée par Bictorys ou générée pour eux
    provider_ref = models.CharField(
        max_length=120,
        unique=True,
        db_index=True,
        help_text="ID de transaction unique (ex: checkout_token)"
    )

    amount = models.PositiveIntegerField(default=1000)
    currency = models.CharField(max_length=8, default="XOF")

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    # Stockage du JSON complet renvoyé par le webhook pour audit
    payload = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["provider_ref"]),
            models.Index(fields=["status"]),
        ]

    def mark_as_paid(self):
        """Marque le paiement comme réussi et déclenche l'abonnement."""
        if self.status != self.Status.PAID:
            self.status = self.Status.PAID
            self.paid_at = timezone.now()
            self.save(update_fields=["status", "paid_at"])

            # Déclenchement automatique de l'abonnement
            Subscription.activate_for_user(self.user, self)

    def __str__(self) -> str:
        return f"Payment {self.provider_ref} - {self.amount} {self.currency} ({self.status})"


class Subscription(models.Model):
    """
    Gère l'accès "Premium" du professionnel (E-commerce & Visibilité).
    """

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        EXPIRED = "EXPIRED", "Expirée"
        CANCELED = "CANCELED", "Annulée"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="subscriptions",
        on_delete=models.CASCADE
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.EXPIRED
    )
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)

    # Lien vers le dernier paiement ayant généré/prolongé cet abonnement
    last_payment = models.ForeignKey(
        Payment,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-end_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
        ]

    def is_active(self) -> bool:
        """Vérifie si l'abonnement est valide à l'instant T."""
        if self.status != self.Status.ACTIVE:
            return False
        if not self.end_at:
            return False
        return timezone.now() < self.end_at

    @classmethod
    def activate_for_user(cls, user, payment):
        """
        Logique métier : Crée ou prolonge un abonnement de 30 jours.
        Appelé automatiquement dès qu'un paiement est 'PAID'.
        """
        # On récupère l'abonnement actif actuel ou on en crée un
        sub, created = cls.objects.get_or_create(
            user=user,
            defaults={'status': cls.Status.ACTIVE}
        )

        maintenant = timezone.now()

        # Si l'abonnement est déjà actif et non expiré, on ajoute 30 jours à la fin
        if not created and sub.is_active():
            sub.end_at = sub.end_at + timedelta(days=30)
        else:
            # Sinon, on commence l'abonnement à partir de maintenant
            sub.start_at = maintenant
            sub.end_at = maintenant + timedelta(days=30)
            sub.status = cls.Status.ACTIVE

        sub.last_payment = payment
        sub.save()

        # IMPORTANT : Mettre à jour le profil pro pour qu'il devienne visible (est_publie)
        if hasattr(user, 'pro_profile'):
            user.pro_profile.est_publie = True
            user.pro_profile.save(update_fields=["est_publie"])

    def __str__(self) -> str:
        return f"Abonnement {self.user.phone} ({self.status})"