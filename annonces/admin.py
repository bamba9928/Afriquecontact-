from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import Annonce


@admin.register(Annonce)
class AnnonceAdmin(admin.ModelAdmin):
    list_display = (
        'titre_limite',
        'type_badge',
        'categorie',
        'zone_geographique',
        'auteur_link',
        'telephone',
        'est_approuvee_icon',
        'cree_le'
    )

    list_display_links = ('titre_limite',)

    list_filter = (
        'est_approuvee',
        'type',
        'categorie',
        'cree_le',
        'zone_geographique__parent'  # Filtrer par région/pays via le parent
    )

    # Recherche performante (User par phone, et contenu de l'annonce)
    search_fields = (
        'titre',
        'description',
        'telephone',
        'auteur__phone',
        'auteur__email'
    )

    # Indispensable pour éviter les listes déroulantes de 1000 items
    autocomplete_fields = ['auteur', 'categorie', 'zone_geographique']

    readonly_fields = ('slug', 'nb_vues', 'cree_le', 'mis_a_jour_le')

    fieldsets = (
        ("Contenu de l'annonce", {
            "fields": (
                "auteur",
                ("type", "titre", "slug"),
                "categorie",
                "description",
            )
        }),
        ("Localisation & Contact", {
            "fields": (
                ("zone_geographique", "adresse_precise"),
                "telephone",
            )
        }),
        ("Modération & Stats", {
            "fields": (
                "est_approuvee",
                ("nb_vues", "cree_le", "mis_a_jour_le"),
            ),
            "classes": ("collapse",),
        }),
    )

    actions = ['approuver_annonces', 'rejeter_annonces']

    # --- Colonnes personnalisées ---

    def titre_limite(self, obj):
        """Coupe le titre s'il est trop long pour l'admin"""
        if len(obj.titre) > 40:
            return obj.titre[:40] + "..."
        return obj.titre

    titre_limite.short_description = "Titre"

    def type_badge(self, obj):
        """Affiche OFFRE en vert et DEMANDE en bleu"""
        colors = {
            Annonce.TypeAnnonce.OFFRE: '#28a745',  # Vert
            Annonce.TypeAnnonce.DEMANDE: '#007bff',  # Bleu
        }
        color = colors.get(obj.type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 10px;">{}</span>',
            color,
            obj.get_type_display().split(" ")[0].upper()  # Affiche juste "OFFRE" ou "DEMANDE"
        )

    type_badge.short_description = "Type"

    def auteur_link(self, obj):
        """Lien direct vers la fiche de l'utilisateur"""
        return obj.auteur.phone

    auteur_link.short_description = "Auteur"

    def est_approuvee_icon(self, obj):
        return obj.est_approuvee

    est_approuvee_icon.boolean = True
    est_approuvee_icon.short_description = "Validée ?"

    # --- Actions ---

    @admin.action(description="✅ Approuver les annonces sélectionnées")
    def approuver_annonces(self, request, queryset):
        rows_updated = queryset.update(est_approuvee=True)
        self.message_user(request, f"{rows_updated} annonces approuvées et mises en ligne.")

    @admin.action(description="❌ Rejeter/Masquer les annonces sélectionnées")
    def rejeter_annonces(self, request, queryset):
        rows_updated = queryset.update(est_approuvee=False)
        self.message_user(request, f"{rows_updated} annonces retirées.")