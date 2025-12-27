from django.db import models
from django.utils import timezone


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
    fichier = models.FileField(upload_to="ads/", verbose_name="Image ou Vidéo")
    lien_redirection = models.URLField(blank=True, verbose_name="Lien (Site web)")

    # Contacts du commandeur
    telephone_appel = models.CharField(max_length=32, verbose_name="Tel Appel")
    telephone_whatsapp = models.CharField(max_length=32, verbose_name="Tel WhatsApp")

    date_debut = models.DateTimeField(default=timezone.now)
    duree_jours = models.IntegerField(choices=Duree.choices, default=Duree.SEMAINE)
    date_fin = models.DateTimeField(editable=False)

    est_active = models.BooleanField(default=True)
    cree_le = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        from datetime import timedelta
        if self.date_debut and self.duree_jours:
            self.date_fin = self.date_debut + timedelta(days=self.duree_jours)

        # Désactivation automatique si date passée
        if self.date_fin and timezone.now() > self.date_fin:
            self.est_active = False

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pub: {self.titre} ({self.get_duree_jours_display()})"