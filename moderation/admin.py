from django.contrib import admin
from moderation.models import Signalement


@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    # Colonnes affichées dans la liste
    list_display = (
        "id",
        "professionnel",
        "auteur",
        "raison",
        "statut",
        "cree_le"
    )

    # Filtres disponibles dans la barre latérale
    list_filter = ("statut", "raison", "cree_le")

    # Champs sur lesquels porte la recherche
    search_fields = (
        "professionnel__business_name",
        "auteur__phone",
        "message"
    )

    # Tri par défaut (du plus récent au plus ancien)
    ordering = ("-cree_le",)

    # Optionnel : pour rendre certains champs en lecture seule dans le détail
    readonly_fields = ("cree_le", "traite_le")