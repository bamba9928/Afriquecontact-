from __future__ import annotations

import uuid
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinLengthValidator, RegexValidator
from django.db import models
from django.db.models import F
from django.utils import timezone
from django.utils.text import slugify

from catalog.models import JobCategory, Location

PHONE_VALIDATOR = RegexValidator(
    regex=r"^\+?\d{8,15}$",
    message="Téléphone invalide. Format attendu: +221771234567 ou 771234567 (8 à 15 chiffres).",
)


def make_unique_slug(model_cls: type[models.Model], base: str, *, max_len: int = 255, pk=None) -> str:
    base_slug = (slugify(base)[:max_len] or "item").strip("-")
    slug = base_slug
    i = 2
    qs = model_cls.objects.all()
    if pk is not None:
        qs = qs.exclude(pk=pk)

    while qs.filter(slug=slug).exists():
        suffix = f"-{i}"
        slug = f"{base_slug[: max_len - len(suffix)]}{suffix}"
        i += 1
    return slug


class Annonce(models.Model):
    class TypeAnnonce(models.TextChoices):
        DEMANDE = "DEMANDE", "Demander un service / emploi"
        OFFRE = "OFFRE", "Offrir un service / emploi"

    class Statut(models.TextChoices):
        BROUILLON = "BROUILLON", "Brouillon"
        EN_ATTENTE = "EN_ATTENTE", "En attente de validation"
        PUBLIEE = "PUBLIEE", "Publiée"
        REJETEE = "REJETEE", "Rejetée"
        ARCHIVEE = "ARCHIVEE", "Archivée"

    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="annonces",
        verbose_name="Auteur",
        db_index=True,
    )

    type = models.CharField(
        max_length=10,
        choices=TypeAnnonce.choices,
        db_index=True,
        verbose_name="Type d'annonce",
    )

    titre = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(5)],
        db_index=True,
        verbose_name="Titre de l'annonce",
    )

    slug = models.SlugField(max_length=255, unique=True, blank=True, db_index=True)

    description = models.TextField(
        validators=[MinLengthValidator(30)],
        verbose_name="Description détaillée",
    )

    zone_geographique = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name="annonces",
        verbose_name="Lieu (Ville/Quartier)",
        null=True,
        blank=True,
        db_index=True,
    )

    adresse_precise = models.CharField(
        max_length=255,
        validators=[MinLengthValidator(3)],
        blank=True,
        help_text="Ex: Rue 10, à côté de la boulangerie",
    )

    telephone = models.CharField(
        max_length=32,
        validators=[PHONE_VALIDATOR],
        db_index=True,
        verbose_name="Contact pour l'annonce",
    )

    categorie = models.ForeignKey(
        JobCategory,
        on_delete=models.PROTECT,
        related_name="annonces",
        db_index=True,
        verbose_name="Secteur d'activité",
    )

    statut = models.CharField(
        max_length=15,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
        db_index=True,
    )

    # Compatibilité: on conserve le bool si tu l’utilises déjà dans d’autres endroits
    est_approuvee = models.BooleanField(default=False, db_index=True)

    approuvee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="annonces_approuvees",
    )
    approuvee_le = models.DateTimeField(null=True, blank=True)
    motif_rejet = models.TextField(blank=True)

    # Statistiques
    nb_vues = models.PositiveIntegerField(default=0, verbose_name="Nombre de vues")

    cree_le = models.DateTimeField(auto_now_add=True, db_index=True)
    mis_a_jour_le = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Annonce"
        verbose_name_plural = "Annonces"
        ordering = ["-cree_le"]
        indexes = [
            models.Index(fields=["est_approuvee", "cree_le"]),   # ✅ (sans "-")
            models.Index(fields=["statut", "cree_le"]),
            models.Index(fields=["categorie", "est_approuvee"]),
            models.Index(fields=["type", "est_approuvee"]),
            models.Index(fields=["zone_geographique", "est_approuvee"]),
            models.Index(fields=["slug"]),
        ]

    def clean(self):
        # cohérence statut / approbation
        if self.statut == self.Statut.PUBLIEE and not self.est_approuvee:
            raise ValidationError({"est_approuvee": "Une annonce publiée doit être approuvée."})

    def save(self, *args, **kwargs):
        if self.telephone:
            self.telephone = self.telephone.replace(" ", "").strip()

        # Synchronise est_approuvee sur statut
        if self.statut == self.Statut.PUBLIEE:
            self.est_approuvee = True
        elif self.statut in (self.Statut.REJETEE, self.Statut.EN_ATTENTE, self.Statut.BROUILLON, self.Statut.ARCHIVEE):
            self.est_approuvee = False

        if not self.slug and self.titre:
            base = slugify(self.titre)[:200] or "annonce"
            # Ajoute un petit suffix pour réduire les collisions
            base = f"{base}-{uuid.uuid4().hex[:6]}"
            self.slug = make_unique_slug(Annonce, base, max_len=255, pk=self.pk)

        super().save(*args, **kwargs)

    def increment_views(self):
        Annonce.objects.filter(pk=self.pk).update(nb_vues=F("nb_vues") + 1)

    def __str__(self):
        return f"[{self.type}] {self.titre}"
