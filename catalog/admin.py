from django.contrib import admin
from .models import Location, JobCategory, Job


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    # Affiche le nom, le type (Ville/Région) et le parent
    list_display = ("name", "type", "parent", "slug")

    # Filtres latéraux très utiles pour trier par Pays ou Région
    list_filter = ("type",)

    # Barre de recherche (indispensable quand on aura 1000+ lieux)
    search_fields = ("name", "slug")

    # Remplissage automatique du slug pour le SEO (ex: "Dakar" -> "dakar")
    prepopulated_fields = {"slug": ("name",)}

    # Permet de chercher le parent dans une liste déroulante optimisée
    # (évite de charger les 5000 lieux d'un coup)
    autocomplete_fields = ["parent"]


@admin.register(JobCategory)
class JobCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ["parent"]


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "is_featured", "slug")

    # Filtres pour voir rapidement les métiers "En vedette"
    list_filter = ("is_featured", "category")

    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}

    # Recherche rapide de la catégorie parente
    autocomplete_fields = ["category"]