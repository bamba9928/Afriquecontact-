from django.urls import path
from .views import (
    AnnonceCreateView,
    AnnoncePublicListView,
    MesAnnoncesListView,
    AdminApprobationAnnonceView,

    # nouveaux (non-breaking)
    AnnonceDetailView,
    AnnonceUpdateView,
    AnnonceDeleteView,
    AnnonceSearchView,
    AnnonceViewIncrement,
)

urlpatterns = [
    # --- Flux Public ---
    path("", AnnoncePublicListView.as_view(), name="annonces-liste"),
    path("search/", AnnonceSearchView.as_view(), name="annonces-search"),
    path("<slug:slug>/", AnnonceDetailView.as_view(), name="annonces-detail"),
    path("<slug:slug>/view/", AnnonceViewIncrement.as_view(), name="annonces-view"),

    # --- Espace Utilisateur ---
    path("creer/", AnnonceCreateView.as_view(), name="annonces-creer"),
    path("mes-annonces/", MesAnnoncesListView.as_view(), name="annonces-mes-annonces"),
    path("<slug:slug>/modifier/", AnnonceUpdateView.as_view(), name="annonces-modifier"),
    path("<slug:slug>/supprimer/", AnnonceDeleteView.as_view(), name="annonces-supprimer"),

    # --- Espace Administration ---
    path("admin/<int:pk>/approuver/", AdminApprobationAnnonceView.as_view(), name="admin-annonces-approuver"),
]
