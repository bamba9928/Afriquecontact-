from django.urls import path
from .views import (
    AnnonceCreateView,
    AnnoncePublicListView,
    MesAnnoncesListView,
    AdminApprobationAnnonceView
)

urlpatterns = [
    # --- Flux Public ---
    # Liste des annonces approuvées (Filtres type, catégorie, zone via query params)
    path("", AnnoncePublicListView.as_view(), name="annonces-liste"),

    # --- Espace Utilisateur ---
    # Créer une annonce (Gratuit pour DEMANDE, 1000F pour OFFRE)
    path("creer/", AnnonceCreateView.as_view(), name="annonces-creer"),

    # Voir ses propres annonces (pour modification ou suppression)
    path("mes-annonces/", MesAnnoncesListView.as_view(), name="annonces-mes-annonces"),

    # --- Espace Administration ---
    # Approuver ou rejeter une annonce spécifique (Réservé Admin)
    path("admin/<int:pk>/approuver/", AdminApprobationAnnonceView.as_view(), name="admin-annonces-approuver"),
]