from __future__ import annotations

from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.core.validators import FileExtensionValidator


class PubliciteManager(models.Manager):
    def en_cours(self):
        """Retourne uniquement les pubs actives ET dont la date n'est pas passée."""
        now = timezone.now()
        return self.get_queryset().filter(
            est_active=True,
            date_debut__lte=now,
            date_fin__gte=now
        )


class Publicite(models.Model):
    class Duree(models.IntegerChoices):
        TROIS_JOURS = 3, "3 Jours"
        SEMAINE = 7, "1 Semaine"
        QUINZE_JOURS = 15, "15 Jours"
        MOIS = 30, "1 Mois"
        DEUX_MOIS = 60, "2 Mois"
        TROIS_MOIS = 90, "3 Mois"
        SIX_MOIS = 180, "6 Mois"

    titre = models.CharField(max_length=200, verbose_name="Titre de la pub")

    # Sécurité : on limite aux images et vidéos
    fichier = models.FileField(
        upload_to="ads/",
        verbose_name="Image ou Vidéo",
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'mp4', 'mov'])]
    )

    lien_redirection = models.URLField(blank=True, verbose_name="Lien (Site web)")

    # Contacts du commandeur (optionnels ou obligatoires selon votre besoin)
    telephone_appel = models.CharField(max_length=32, blank=True, verbose_name="Tel Appel")
    telephone_whatsapp = models.CharField(max_length=32, blank=True, verbose_name="Tel WhatsApp")

    date_debut = models.DateTimeField(default=timezone.now)
    duree_jours = models.IntegerField(choices=Duree.choices, default=Duree.SEMAINE)

    # On laisse blank=True car c'est auto-généré
    date_fin = models.DateTimeField(editable=False, null=True, blank=True)

    # est_active sert de "Switch manuel" (ex: admin bannit la pub)
    est_active = models.BooleanField(default=True, verbose_name="Activé manuellement")

    cree_le = models.DateTimeField(auto_now_add=True)

    objects = PubliciteManager()

    def save(self, *args, **kwargs):
        # Calcul automatique de la date de fin
        if self.date_debut and self.duree_jours:
            self.date_fin = self.date_debut + timedelta(days=self.duree_jours)

        super().save(*args, **kwargs)

    @property
    def est_visible(self) -> bool:
        """Vrai si la pub doit être affichée maintenant."""
        now = timezone.now()
        return self.est_active and (self.date_fin and self.date_fin > now)

    def __str__(self):
        return f"{self.titre} ({self.get_duree_jours_display()})"