from __future__ import annotations
from django.conf import settings
from django.db import models

from catalog.models import Job, Location

class ProfilProfessionnel(models.Model):
    class StatutEnLigne(models.TextChoices):
        EN_LIGNE = "ONLINE", "En ligne"
        HORS_LIGNE = "OFFLINE", "Hors service"

    utilisateur = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="pro_profile",
        on_delete=models.CASCADE,
        verbose_name="Utilisateur"
    )

    nom_entreprise = models.CharField(max_length=160, verbose_name="Nom commercial")
    metier = models.ForeignKey(
        Job,
        related_name="pros",
        on_delete=models.PROTECT,
        verbose_name="Métier"
    )
    zone_geographique = models.ForeignKey(
        Location,
        related_name="pros",
        on_delete=models.PROTECT,
        verbose_name="Localisation"
    )

    description = models.TextField(blank=True, verbose_name="Description")

    telephone_appel = models.CharField(max_length=32, verbose_name="Téléphone (Appel)")
    telephone_whatsapp = models.CharField(max_length=32, verbose_name="Téléphone (WhatsApp)")

    avatar = models.ImageField(upload_to="pros/avatars/", null=True, blank=True)

    statut_en_ligne = models.CharField(
        max_length=10,
        choices=StatutEnLigne.choices,
        default=StatutEnLigne.EN_LIGNE,
        verbose_name="Statut de disponibilité"
    )
    est_publie = models.BooleanField(default=False, verbose_name="Est publié")

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    cree_le = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    mis_a_jour_le = models.DateTimeField(auto_now=True, verbose_name="Mis à jour le")

    class Meta:
        verbose_name = "Profil Professionnel"
        verbose_name_plural = "Profils Professionnels"
        indexes = [
            models.Index(fields=["metier"]),
            models.Index(fields=["zone_geographique"]),
            models.Index(fields=["est_publie"]),
            models.Index(fields=["statut_en_ligne"]),
        ]

    def __str__(self) -> str:
        return f"{self.nom_entreprise} ({self.utilisateur.phone})"


class MediaPro(models.Model):
    class TypeMedia(models.TextChoices):
        PHOTO = "PHOTO", "Photo"
        VIDEO = "VIDEO", "Vidéo"
        CV = "CV", "CV"

    professionnel = models.ForeignKey(
        ProfilProfessionnel,
        related_name="media",
        on_delete=models.CASCADE,
        verbose_name="Profil professionnel"
    )
    type_media = models.CharField(
        max_length=10,
        choices=TypeMedia.choices,
        verbose_name="Type de contenu"
    )
    fichier = models.FileField(upload_to="pros/media/", verbose_name="Fichier")

    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Média Professionnel"
        verbose_name_plural = "Médias Professionnels"
        indexes = [models.Index(fields=["professionnel", "type_media"])]

    def __str__(self) -> str:
        return f"{self.professionnel_id} {self.type_media}"


class ContactFavori(models.Model):
    proprietaire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="favorites",
        on_delete=models.CASCADE,
        verbose_name="Utilisateur (Propriétaire)"
    )
    professionnel = models.ForeignKey(
        ProfilProfessionnel,
        related_name="favorited_by",
        on_delete=models.CASCADE,
        verbose_name="Profil favorisé"
    )
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Contact Favori"
        verbose_name_plural = "Contacts Favoris"
        unique_together = ("proprietaire", "professionnel")
        indexes = [models.Index(fields=["proprietaire"])]

    def __str__(self) -> str:
        return f"Favori({self.proprietaire_id} -> {self.professionnel_id})"