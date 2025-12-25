from django.contrib import admin
from django.utils.html import format_html
from .models import ProfilProfessionnel, MediaPro, ContactFavori


# --- Inline pour gérer les Médias directement depuis la fiche Pro ---
class MediaProInline(admin.TabularInline):
    model = MediaPro
    extra = 1  # Affiche une ligne vide pour ajouter rapidement
    fields = ("type_media", "fichier", "est_principal", "apercu_image")
    readonly_fields = ("apercu_image",)

    def apercu_image(self, obj):
        if obj.fichier and obj.type_media == MediaPro.TypeMedia.PHOTO:
            return format_html('<img src="{}" style="height: 50px; border-radius: 5px;" />', obj.fichier.url)
        return "-"

    apercu_image.short_description = "Aperçu"


@admin.register(ProfilProfessionnel)
class ProfilProfessionnelAdmin(admin.ModelAdmin):
    # Colonnes affichées dans la liste
    list_display = (
        "nom_entreprise",
        "metier",
        "zone_geographique",
        "telephone_appel",
        "statut_en_ligne",
        "est_publie_icon",  # On utilise une fonction custom pour une jolie icône
        "note_moyenne"
    )

    # Filtres latéraux (très puissant pour l'admin)
    list_filter = (
        "est_publie",
        "statut_en_ligne",
        "metier",
        "zone_geographique__parent__name"  # Filtre par Région (parent de la ville)
    )

    # Barre de recherche
    search_fields = ("nom_entreprise", "telephone_appel", "utilisateur__phone", "description")

    # Organisation du formulaire d'édition
    fieldsets = (
        ("Identité", {
            "fields": ("utilisateur", "nom_entreprise", "avatar", "description")
        }),
        ("Activité & Localisation", {
            "fields": ("metier", "zone_geographique", "zones_intervention")
        }),
        ("Contacts & Disponibilité", {
            "fields": ("telephone_appel", "telephone_whatsapp", "statut_en_ligne")
        }),
        ("Modération & Performance", {
            "fields": ("est_publie", "note_moyenne", "nombre_avis")
        }),
        ("Géolocalisation précise", {
            "fields": ("latitude", "longitude"),
            "classes": ("collapse",)  # Cache cette section par défaut pour ne pas polluer
        }),
    )

    # Optimisation des relations (évite de charger 5000 villes d'un coup)
    autocomplete_fields = ["metier", "zone_geographique", "utilisateur"]

    # Interface pour choisir plusieurs zones (ManyToMany)
    filter_horizontal = ("zones_intervention",)

    # Ajout des médias en bas de page
    inlines = [MediaProInline]

    # Actions de masse
    actions = ["publier_profils", "desactiver_profils"]

    @admin.display(description="Publié ?", boolean=True)
    def est_publie_icon(self, obj):
        return obj.est_publie

    @admin.action(description="✅ Publier les profils sélectionnés")
    def publier_profils(self, request, queryset):
        updated = queryset.update(est_publie=True)
        self.message_user(request, f"{updated} profil(s) publié(s) avec succès.")

    @admin.action(description="❌ Dépublier (Masquer) les profils sélectionnés")
    def desactiver_profils(self, request, queryset):
        updated = queryset.update(est_publie=False)
        self.message_user(request, f"{updated} profil(s) masqué(s).")


@admin.register(MediaPro)
class MediaProAdmin(admin.ModelAdmin):
    """Vue globale de tous les médias uploadés (utile pour la modération)"""
    list_display = ("id", "type_media", "professionnel", "est_principal", "cree_le")
    list_filter = ("type_media", "est_principal")
    search_fields = ("professionnel__nom_entreprise",)


@admin.register(ContactFavori)
class ContactFavoriAdmin(admin.ModelAdmin):
    list_display = ("proprietaire", "professionnel", "cree_le")
    search_fields = ("proprietaire__phone", "professionnel__nom_entreprise")
    list_filter = ("cree_le",)