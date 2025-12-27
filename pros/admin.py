from __future__ import annotations

from django.contrib import admin, messages
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html, mark_safe

from .models import (
    ProfilProfessionnel,
    MediaPro,
    ContactFavori,
)


# =========================
# Inlines
# =========================
class MediaProInline(admin.TabularInline):
    model = MediaPro
    extra = 1
    fields = ("type_media", "fichier", "apercu_fichier", "est_principal")
    readonly_fields = ("apercu_fichier", "cree_le")

    @admin.display(description="Aperçu")
    def apercu_fichier(self, obj):
        if obj.fichier and obj.type_media == "PHOTO":
            try:
                return mark_safe(
                    f'<img src="{obj.fichier.url}" style="height: 50px; border-radius: 4px;" />'
                )
            except ValueError:
                return "-"
        return "-"


# =========================
# ProfilProfessionnel
# =========================
@admin.register(ProfilProfessionnel)
class ProfilProfessionnelAdmin(admin.ModelAdmin):
    list_display = (
        "apercu_avatar",
        "nom_entreprise",
        "metier",
        "zone_geographique",
        "statut_en_ligne",
        "est_publie",
        "note_moyenne_display",
    )
    list_display_links = ("apercu_avatar", "nom_entreprise")

    list_filter = (
        "est_publie",
        "statut_en_ligne",
        "metier",
        "zone_geographique",
    )

    search_fields = (
        "nom_entreprise",
        "utilisateur__email",
        "utilisateur__phone",
        "telephone_appel",
        "telephone_whatsapp",
    )

    autocomplete_fields = ["metier", "zone_geographique", "utilisateur"]
    filter_horizontal = ("zones_intervention",)

    readonly_fields = ("slug", "cree_le", "mis_a_jour_le", "apercu_avatar_large")
    inlines = [MediaProInline]

    fieldsets = (
        (
            "Identité & Localisation",
            {
                "fields": (
                    "utilisateur",
                    ("nom_entreprise", "slug"),
                    "metier",
                    ("zone_geographique", "zones_intervention"),
                )
            },
        ),
        (
            "Détails & Contact",
            {
                "fields": (
                    "description",
                    ("telephone_appel", "telephone_whatsapp"),
                    "avatar",
                    "apercu_avatar_large",
                )
            },
        ),
        (
            "État & Disponibilité",
            {
                "fields": (
                    ("est_publie", "statut_en_ligne"),
                    ("latitude", "longitude"),
                )
            },
        ),
        (
            "Statistiques",
            {
                "fields": (("note_moyenne", "nombre_avis"), ("cree_le", "mis_a_jour_le")),
                "classes": ("collapse",),
            },
        ),
    )

    actions = ["publier_profils", "depublier_profils"]

    @admin.display(description="Avatar")
    def apercu_avatar(self, obj):
        if obj.avatar:
            try:
                return mark_safe(
                    f'<img src="{obj.avatar.url}" '
                    f'style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" />'
                )
            except ValueError:
                return "Err"
        return "Aucun"

    @admin.display(description="Aperçu actuel")
    def apercu_avatar_large(self, obj):
        if obj.avatar:
            try:
                return mark_safe(
                    f'<img src="{obj.avatar.url}" style="max-height: 200px; border-radius: 8px;" />'
                )
            except ValueError:
                return ""
        return ""

    @admin.display(description="Réputation")
    def note_moyenne_display(self, obj):
        return f"⭐ {obj.note_moyenne} ({obj.nombre_avis})"

    @admin.action(description="Publier les profils sélectionnés")
    def publier_profils(self, request, queryset):
        queryset.update(est_publie=True)

    @admin.action(description="Masquer (Dépublier) les profils sélectionnés")
    def depublier_profils(self, request, queryset):
        queryset.update(est_publie=False)


# =========================
# MediaPro
# =========================
@admin.register(MediaPro)
class MediaProAdmin(admin.ModelAdmin):
    list_display = ("id", "apercu_fichier", "professionnel", "type_media", "est_principal", "cree_le")
    list_filter = ("type_media", "est_principal")
    search_fields = ("professionnel__nom_entreprise",)
    autocomplete_fields = ["professionnel"]

    @admin.display(description="Contenu")
    def apercu_fichier(self, obj):
        if obj.fichier and obj.type_media == "PHOTO":
            try:
                return mark_safe(f'<img src="{obj.fichier.url}" style="height: 40px;" />')
            except ValueError:
                return "-"
        return obj.get_type_media_display()


# =========================
# ContactFavori
# =========================
@admin.register(ContactFavori)
class ContactFavoriAdmin(admin.ModelAdmin):
    list_display = ("proprietaire", "professionnel", "cree_le")
    search_fields = ("proprietaire__phone", "professionnel__nom_entreprise")
    autocomplete_fields = ["proprietaire", "professionnel"]


