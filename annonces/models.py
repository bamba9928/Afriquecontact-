from __future__ import annotations

import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator, RegexValidator
from django.utils.text import slugify

from catalog.models import JobCategory, Location

PHONE_VALIDATOR = RegexValidator(
    regex=r"^\+?\d{8,15}$",
    message="Téléphone invalide. Format attendu: +221771234567 ou 771234567 (8 à 15 chiffres).",
)


class Annonce(models.Model):
    class TypeAnnonce(models.TextChoices):
        DEMANDE = "DEMANDE", "Demander un service / emploi"
        OFFRE = "OFFRE", "Offrir un service / emploi"

    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="annonces",
        verbose_name="Auteur"
    )

    type = models.CharField(
        max_length=10,
        choices=TypeAnnonce.choices,
        db_index=True,
        verbose_name="Type d'annonce"
    )

    titre = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(5)],
        db_index=True,
        verbose_name="Titre de l'annonce"
    )

    slug = models.SlugField(max_length=255, unique=True, blank=True, db_index=True)

    description = models.TextField(
        validators=[MinLengthValidator(30)],
        verbose_name="Description détaillée"
    )

    # Localisation précise de l'annonce
    zone_geographique = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name="annonces",
        verbose_name="Lieu (Ville/Quartier)",
        null=True
    )

    adresse_precise = models.CharField(
        max_length=255,
        validators=[MinLengthValidator(3)],
        blank=True,
        help_text="Ex: Rue 10, à côté de la boulangerie"
    )

    telephone = models.CharField(
        max_length=32,
        validators=[PHONE_VALIDATOR],
        db_index=True,
        verbose_name="Contact pour l'annonce"
    )

    categorie = models.ForeignKey(
        JobCategory,
        on_delete=models.PROTECT,
        related_name="annonces",
        db_index=True,
        verbose_name="Secteur d'activité"
    )

    # État de modération
    est_approuvee = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Approuvée par l'admin"
    )

    # Statistiques
    nb_vues = models.PositiveIntegerField(default=0, verbose_name="Nombre de vues")

    cree_le = models.DateTimeField(auto_now_add=True, db_index=True)
    mis_a_jour_le = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Annonce"
        verbose_name_plural = "Annonces"
        ordering = ["-cree_le"]
        indexes = [
            models.Index(fields=["est_approuvee", "-cree_le"]),
            models.Index(fields=["categorie", "est_approuvee"]),
            models.Index(fields=["type", "est_approuvee"]),
            models.Index(fields=["slug"]),
        ]

    def save(self, *args, **kwargs):
        # Normalisation du téléphone
        if self.telephone:
            self.telephone = self.telephone.replace(" ", "").strip()

        # Génération du slug SEO unique
        if not self.slug and self.titre:
            unique_id = uuid.uuid4().hex[:6]
            self.slug = f"{slugify(self.titre)[:200]}-{unique_id}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.type}] {self.titre}"