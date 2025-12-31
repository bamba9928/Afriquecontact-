from django.urls import path
from .views import (
    AnnonceCreateView,
    AnnoncePublicListView,
    MesAnnoncesListView,
    AnnonceDetailView,
    AdminApprobationAnnonceView
)

urlpatterns = [
    # --- Flux Public ---
    path("", AnnoncePublicListView.as_view(), name="annonces-liste"),

    # --- Espace Utilisateur ---
    path("creer/", AnnonceCreateView.as_view(), name="annonces-creer"),
    path("mes-annonces/", MesAnnoncesListView.as_view(), name="annonces-mes-annonces"),

    # --- CRUD (Détail, Update, Delete) ---
    # C'est cette ligne qui manque pour faire fonctionner le frontend :
    path("<int:pk>/", AnnonceDetailView.as_view(), name="annonces-detail"),

    # --- Espace Administration ---
    path("admin/<int:pk>/approuver/", AdminApprobationAnnonceView.as_view(), name="admin-annonces-approuver"),
]