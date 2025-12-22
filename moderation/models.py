from django.db import models
from django.conf import settings
from pros.models import ProfilProfessionnel


class Signalement(models.Model):
    """
    Modèle pour gérer les signalements des profils professionnels par les utilisateurs.
    """

    class Statut(models.TextChoices):
        OUVERT = "OUVERT", "Ouvert"
        EN_COURS = "EN_COURS", "En cours de traitement"
        RESOLU = "RESOLU", "Résolu"
        REJETE = "REJETE", "Rejeté"

    class Raison(models.TextChoices):
        CONTENU_INAPPROPRIE = "CONTENU_INAPPROPRIE", "Contenu inapproprié"
        COMPORTEMENT_ABUSIF = "COMPORTEMENT_ABUSIF", "Comportement abusif"
        FRAUDE = "FRAUDE", "Fraude ou Arnaque"
        AUTRE = "AUTRE", "Autre"

    # Relations
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="signalements_emis",
        verbose_name="Signaleur"
    )
    professionnel = models.ForeignKey(
        ProfilProfessionnel,
        on_delete=models.CASCADE,
        related_name="signalements_recus",
        verbose_name="Profil signalé"
    )

    # Contenu
    raison = models.CharField(
        max_length=50,
        choices=Raison.choices,
        default=Raison.AUTRE,
        verbose_name="Raison du signalement"
    )
    message = models.TextField(
        blank=True,
        verbose_name="Message détaillé"
    )

    # État du signalement
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.OUVERT,
        verbose_name="Statut"
    )
    traite_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="signalements_geres",
        verbose_name="Traité par"
    )

    # Horodatage
    cree_le = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    traite_le = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de traitement"
    )

    class Meta:
        verbose_name = "Signalement"
        verbose_name_plural = "Signalements"
        ordering = ["-cree_le"]

    def __str__(self):
        return f"Signalement de {self.auteur} contre {self.professionnel} ({self.statut})"