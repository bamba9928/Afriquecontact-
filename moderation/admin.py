from django.contrib import admin
from django.utils.timezone import now
from moderation.models import Signalement

@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    # Colonnes affichées dans la liste (E2)
    list_display = (
        "id",
        "professionnel_nom",
        "raison",
        "statut",
        "auteur_phone",
        "cree_le",
        "traite_par"
    )

    # Filtres pour une gestion rapide
    list_filter = ("statut", "raison", "cree_le", "traite_le")

    # Recherche textuelle
    search_fields = (
        "professionnel__nom_entreprise",
        "auteur__phone",
        "message",
        "note_admin"
    )

    # Champs en lecture seule pour éviter les modifications accidentelles
    readonly_fields = ("auteur", "professionnel", "cree_le", "traite_le", "traite_par")

    # Organisation du formulaire de détail (E3)
    fieldsets = (
        ("Informations du Signalement", {
            "fields": ("auteur", "professionnel", "raison", "message", "cree_le")
        }),
        ("Traitement Administratif", {
            "fields": ("statut", "note_admin", "traite_par", "traite_le"),
            "description": "Indiquez ici les actions prises (Avertissement, Bannissement, etc.)"
        }),
    )

    def professionnel_nom(self, obj):
        return obj.professionnel.nom_entreprise
    professionnel_nom.short_description = "Profil Signalé"

    def auteur_phone(self, obj):
        return obj.auteur.phone
    auteur_phone.short_description = "Signaleur"

    def save_model(self, request, obj, form, change):
        """
        Enregistre automatiquement l'administrateur qui modifie le statut.
        """
        if change and "statut" in form.changed_data:
            if obj.statut != Signalement.Statut.OUVERT:
                obj.traite_par = request.user
                obj.traite_le = now()
        super().save_model(request, obj, form, change)

    # Actions groupées (pour traiter plusieurs signalements d'un coup)
    actions = ["marquer_rejete"]

    @admin.action(description="Rejeter les signalements sélectionnés")
    def marquer_rejete(self, request, queryset):
        queryset.update(
            statut=Signalement.Statut.REJETE,
            traite_par=request.user,
            traite_le=now()
        )