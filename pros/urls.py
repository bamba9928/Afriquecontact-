from django.urls import path
from .views import (
    MonProfilProView,
    RechercheProView,
    PublicationProView,
    RetraitPublicationProView,
    AdminPublicationProView,
    AdminRetraitPublicationProView
)

urlpatterns = [
    # Routes pour le professionnel (soi-même)
    path("mon-profil/", MonProfilProView.as_view(), name="pro_me"),
    path("recherche/", RechercheProView.as_view(), name="pro_recherche"),

    # Actions de visibilité par le professionnel
    path("publier/", PublicationProView.as_view(), name="pro_publier"),
    path("masquer/", RetraitPublicationProView.as_view(), name="pro_masquer"),

    # Actions d'administration
    path("<int:pro_id>/admin-publier/", AdminPublicationProView.as_view(), name="admin_pro_publier"),
    path("<int:pro_id>/admin-masquer/", AdminRetraitPublicationProView.as_view(), name="admin_pro_masquer"),
]