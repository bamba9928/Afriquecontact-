from django.urls import path
from catalog.views import (
    JobsListView,
    LocationsListView,
    FeaturedJobsView,
    LocationsTreeView,
    JobCategoriesTreeView
)

urlpatterns = [
    # --- Métiers ---
    # Liste globale avec filtres optionnels
    path("jobs/", JobsListView.as_view(), name="jobs-list"),
    # Métiers "Les plus recherchés" (Coiffeur, Mécanicien, etc.) pour l'accueil
    path("jobs/featured/", FeaturedJobsView.as_view(), name="featured-jobs"),
    # Arbre complet des catégories et sous-catégories (BTP > Gros Oeuvre, etc.)
    path("categories/tree/", JobCategoriesTreeView.as_view(), name="categories-tree"),

    # --- Localisations ---
    # Liste simple (Régions ou Villes)
    path("locations/", LocationsListView.as_view(), name="locations-list"),
    # Arbre complet (Sénégal > Régions > Villes > Quartiers) pour les sélecteurs
    path("locations/tree/", LocationsTreeView.as_view(), name="locations-tree"),
]