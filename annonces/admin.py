from django.contrib import admin
from .models import Annonce


@admin.register(Annonce)
class AnnonceAdmin(admin.ModelAdmin):
    # Colonnes affichées dans la liste des annonces
    list_display = (
        "titre",
        "type",
        "categorie",
        "zone_geographique",
        "est_approuvee",
        "nb_vues",
        "cree_le"
    )

    # Filtres latéraux pour une gestion rapide
    list_filter = (
        "est_approuvee",
        "type",
        "categorie",
        "zone_geographique",
        "cree_le"
    )

    # Recherche textuelle
    search_fields = (
        "titre",
        "description",
        "telephone",
        "auteur__phone"
    )

    # Configuration du formulaire de détail
    fieldsets = (
        ("Informations Générales", {
            "fields": ("auteur", "type", "titre", "slug", "categorie")
        }),
        ("Contenu & Contact", {
            "fields": ("description", "telephone", "zone_geographique", "adresse_precise")
        }),
        ("Statut & Performance", {
            "fields": ("est_approuvee", "nb_vues")
        }),
    )

    readonly_fields = ("slug", "nb_vues", "cree_le")
    actions = ["approuver_annonces", "rejeter_annonces"]

    @admin.action(description="✅ Approuver les annonces sélectionnées")
    def approuver_annonces(self, request, queryset):
        updated = queryset.update(est_approuvee=True)
        self.message_user(request, f"{updated} annonces ont été approuvées et sont désormais visibles.")

    @admin.action(description="🚫 Masquer les annonces sélectionnées")
    def rejeter_annonces(self, request, queryset):
        updated = queryset.update(est_approuvee=False)
        self.message_user(request, f"{updated} annonces ont été masquées.")