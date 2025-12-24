from django.urls import path
from moderation.views import (
    SignalementCreateView,
    MesSignalementsListView,
    AdminSignalementsListView,
    AdminSignalementStatusUpdateView,
)

urlpatterns = [
    # --- Espace Utilisateur / Client ---
    # POST pour créer un signalement (E1)
    path("signaler/", SignalementCreateView.as_view(), name="signalement-creer"),

    # GET pour voir l'historique de ses propres signalements
    path("mes-signalements/", MesSignalementsListView.as_view(), name="signalement-mes-listes"),

    # --- Espace Administration (Modération) ---
    # GET pour lister et filtrer tous les signalements (E2)
    path("admin/liste/", AdminSignalementsListView.as_view(), name="admin-signalements-liste"),

    # PATCH/PUT pour traiter un signalement spécifique (E2/E3)
    path("admin/<int:pk>/traiter/", AdminSignalementStatusUpdateView.as_view(), name="admin-signalement-traiter"),
]