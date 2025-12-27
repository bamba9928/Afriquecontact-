from __future__ import annotations

from decimal import Decimal
import os

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from django.db import models
from django.db.models import Q
from django.utils.text import slugify

from catalog.models import Job, Location


class ProfilProfessionnel(models.Model):
    class StatutEnLigne(models.TextChoices):
        EN_LIGNE = "ONLINE", "En ligne"
        HORS_LIGNE = "OFFLINE", "Hors service"

    utilisateur = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="pro_profile",
        on_delete=models.CASCADE,
        verbose_name="Utilisateur",
    )

    nom_entreprise = models.CharField(max_length=160, verbose_name="Nom commercial")
    metier = models.ForeignKey(Job, related_name="pros", on_delete=models.PROTECT, verbose_name="Métier")

    zone_geographique = models.ForeignKey(
        Location,
        related_name="pros_base",
        on_delete=models.PROTECT,
        verbose_name="Localisation principale",
    )

    zones_intervention = models.ManyToManyField(
        Location,
        related_name="pros_intervenants",
        blank=True,
        verbose_name="Zones d'intervention (Quartiers/Villes)",
    )

    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(blank=True, verbose_name="Description")

    telephone_appel = models.CharField(max_length=32, verbose_name="Téléphone (Appel)")
    telephone_whatsapp = models.CharField(max_length=32, verbose_name="Téléphone (WhatsApp)")

    avatar = models.ImageField(upload_to="pros/avatars/", null=True, blank=True)

    statut_en_ligne = models.CharField(
        max_length=10,
        choices=StatutEnLigne.choices,
        default=StatutEnLigne.EN_LIGNE,
        verbose_name="Statut de disponibilité",
    )

    # Business: paiement à jour => visible publiquement
    est_publie = models.BooleanField(default=False, verbose_name="Est visible publiquement")

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    note_moyenne = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("5.00"))],
        verbose_name="Note moyenne",
    )
    nombre_avis = models.PositiveIntegerField(default=0, verbose_name="Nombre d'avis")

    cree_le = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    mis_a_jour_le = models.DateTimeField(auto_now=True, verbose_name="Mis à jour le")

    class Meta:
        verbose_name = "Profil Professionnel"
        verbose_name_plural = "Profils Professionnels"
        indexes = [
            models.Index(fields=["est_publie", "metier", "zone_geographique", "statut_en_ligne"]),
        ]
        constraints = [
            models.CheckConstraint(
                name="pro_latitude_range",
                condition=Q(latitude__isnull=True) | (Q(latitude__gte=-90) & Q(latitude__lte=90)),
            ),
            models.CheckConstraint(
                name="pro_longitude_range",
                condition=Q(longitude__isnull=True) | (Q(longitude__gte=-180) & Q(longitude__lte=180)),
            ),
        ]

    def _build_base_slug(self) -> str:
        m_label = getattr(self.metier, "name", str(self.metier))
        z_label = getattr(self.zone_geographique, "name", str(self.zone_geographique))
        return slugify(f"{m_label} {z_label} {self.nom_entreprise}")[:180]  # garde place pour suffixe

    def _generate_unique_slug(self) -> str:
        base = self._build_base_slug()
        uid = self.utilisateur_id or "new"
        candidate = f"{base}-{uid}"[:200]

        # Si unique => OK
        qs = ProfilProfessionnel.objects.all()
        if self.pk:
            qs = qs.exclude(pk=self.pk)

        if not qs.filter(slug=candidate).exists():
            return candidate

        # Sinon suffixe incrémental
        i = 2
        while True:
            suffix = f"-{i}"
            max_len = 200 - len(suffix)
            cand = (candidate[:max_len] + suffix)[:200]
            if not qs.filter(slug=cand).exists():
                return cand
            i += 1

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        # Evite d'exposer un numéro dans l'admin/logs
        return self.nom_entreprise
class MediaPro(models.Model):
    class TypeMedia(models.TextChoices):
        PHOTO = "PHOTO", "Photo"
        VIDEO = "VIDEO", "Vidéo"
        CV = "CV", "CV"

    professionnel = models.ForeignKey(
        ProfilProfessionnel,
        related_name="media",
        on_delete=models.CASCADE,
        verbose_name="Profil professionnel",
    )

    type_media = models.CharField(max_length=10, choices=TypeMedia.choices, verbose_name="Type de contenu")
    fichier = models.FileField(
        upload_to="pros/media/",
        verbose_name="Fichier",
        validators=[FileExtensionValidator(
            allowed_extensions=["jpg", "jpeg", "png", "webp", "mp4", "mov", "avi", "mkv", "pdf"]
        )],
    )

    est_principal = models.BooleanField(default=False, verbose_name="Média principal")
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Média Professionnel"
        verbose_name_plural = "Médias Professionnels"
        indexes = [models.Index(fields=["professionnel", "type_media"])]
        constraints = [
            models.UniqueConstraint(
                fields=["professionnel"],
                condition=Q(est_principal=True, type_media="PHOTO"),
                name="uniq_photo_principal_par_pro",
            )
        ]

    def clean(self):
        super().clean()
        if not self.fichier:
            return

        ext = os.path.splitext(self.fichier.name)[1].lower()
        rules = {
            self.TypeMedia.PHOTO: {".jpg", ".jpeg", ".png", ".webp"},
            self.TypeMedia.VIDEO: {".mp4", ".mov", ".avi", ".mkv"},
            self.TypeMedia.CV: {".pdf"},
        }
        allowed = rules.get(self.type_media, set())
        if allowed and ext not in allowed:
            raise ValidationError({"fichier": f"Extension {ext} non autorisée pour {self.type_media}."})

        max_sizes = {
            self.TypeMedia.PHOTO: 5 * 1024 * 1024,
            self.TypeMedia.VIDEO: 50 * 1024 * 1024,
            self.TypeMedia.CV: 3 * 1024 * 1024,
        }
        size = getattr(self.fichier, "size", None)
        limit = max_sizes.get(self.type_media)
        if size is not None and limit is not None and size > limit:
            raise ValidationError({"fichier": f"Fichier trop volumineux (max {limit // (1024*1024)} Mo)."})

        if self.est_principal and self.type_media != self.TypeMedia.PHOTO:
            raise ValidationError({"est_principal": "Le média principal doit être une PHOTO."})

class ContactFavori(models.Model):
    proprietaire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="favorites",
        on_delete=models.CASCADE,
        verbose_name="Utilisateur",
    )
    professionnel = models.ForeignKey(
        ProfilProfessionnel,
        related_name="favorited_by",
        on_delete=models.CASCADE,
        verbose_name="Prestataire favorisé",
    )
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Contact Favori"
        verbose_name_plural = "Contacts Favoris"
        constraints = [
            models.UniqueConstraint(fields=["proprietaire", "professionnel"], name="uniq_favori_user_pro")
        ]
        indexes = [
            models.Index(fields=["proprietaire"]),
            models.Index(fields=["professionnel"]),
        ]

    def __str__(self) -> str:
        return f"{self.proprietaire} suit {self.professionnel.nom_entreprise}"
