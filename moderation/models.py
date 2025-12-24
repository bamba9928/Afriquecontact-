from django.db import models
from django.conf import settings
from django.utils.timezone import now
from pros.models import ProfilProfessionnel


class Signalement(models.Model):
    """
    Gère les signalements (E1) et le suivi administratif (E2/E3).
    """

    class Statut(models.TextChoices):
        OUVERT = "OUVERT", "Ouvert"
        EN_COURS = "EN_COURS", "En cours"
        RESOLU = "RESOLU", "Résolu (Sanctionné)"
        REJETE = "REJETE", "Rejeté (Sans suite)"

    class Raison(models.TextChoices):
        CONTENU_INAPPROPRIE = "CONTENU_INAPPROPRIE", "Contenu inapproprié"
        COMPORTEMENT_ABUSIF = "COMPORTEMENT_ABUSIF", "Comportement abusif"
        FRAUDE = "FRAUDE", "Fraude ou Arnaque"
        NUMERO_INCORRECT = "NUMERO_INCORRECT", "Numéro ne répond pas"
        AUTRE = "AUTRE", "Autre"

    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="signalements_emis"
    )
    professionnel = models.ForeignKey(
        ProfilProfessionnel,
        on_delete=models.CASCADE,
        related_name="signalements_recus"
    )

    raison = models.CharField(max_length=50, choices=Raison.choices, default=Raison.AUTRE)
    message = models.TextField(blank=True)

    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.OUVERT)

    # Historique administratif (E3)
    note_admin = models.TextField(blank=True, help_text="Action prise par l'admin (avertissement, ban, etc.)")
    traite_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="signalements_geres"
    )

    cree_le = models.DateTimeField(auto_now_add=True)
    traite_le = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-cree_le"]
        # Empêcher un utilisateur de signaler 100 fois le même pro (anti-spam)
        unique_together = ("auteur", "professionnel", "statut")

    def __str__(self):
        return f"Signalement #{self.id} - {self.professionnel.nom_entreprise}"

    def marquer_comme_traite(self, admin_user, feedback=""):
        self.traite_par = admin_user
        self.traite_le = now()
        self.note_admin = feedback
        self.save()