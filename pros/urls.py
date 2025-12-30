from django.urls import path
from .views import (
    MonProfilProView,
    RechercheProView,
    PublicationProView,
    RetraitPublicationProView,
    AdminPublicationProView,
    AdminRetraitPublicationProView,
    MediaProCreateView,
    ContactFavoriView,
    ContactFavoriDestroyView,
    ProPublicDetailView
)

urlpatterns = [
    # --- Recherche Publique ---
    # Endpoint pour le mobile : GET /api/pros/recherche/?job=...&lat=...
    path("recherche/", RechercheProView.as_view(), name="pro_recherche"),
    path("public/<slug:slug>/", ProPublicDetailView.as_view(), name="pro_public_detail"),

    # --- Espace Professionnel (Gestion de soi) ---
    path("me/", MonProfilProView.as_view(), name="pro_me"),
    path("me/publier/", PublicationProView.as_view(), name="pro_publier"),
    path("me/masquer/", RetraitPublicationProView.as_view(), name="pro_masquer"),

    # Gestion de la galerie (Photos, Vidéos, CV)
    path("me/media/", MediaProCreateView.as_view(), name="pro_media_create"),

    # --- Espace Client (Mes Contacts / Favoris) ---
    # GET pour lister, POST pour ajouter
    path("favoris/", ContactFavoriView.as_view(), name="pro_favoris_list_add"),
    # DELETE pour supprimer un favori spécifique
    path("favoris/<int:professionnel_id>/", ContactFavoriDestroyView.as_view(), name="pro_favoris_delete"),

    # --- Administration (Modération) ---
    path("admin/<int:pro_id>/publier/", AdminPublicationProView.as_view(), name="admin_pro_publier"),
    path("admin/<int:pro_id>/masquer/", AdminRetraitPublicationProView.as_view(), name="admin_pro_masquer"),
]