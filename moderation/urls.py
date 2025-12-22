from django.urls import path

from moderation.views import (
    SignalementCreateView,
    MesSignalementsListView,
    AdminSignalementsListView,
    AdminSignalementStatusUpdateView,
)

urlpatterns = [
    # Routes pour les utilisateurs
    path("signalements/", SignalementCreateView.as_view(), name="signalement_creer"),
    path("signalements/mes-signalements/", MesSignalementsListView.as_view(), name="signalement_mes_listes"),

    # Routes pour l'administration
    path("admin/signalements/", AdminSignalementsListView.as_view(), name="admin_signalements_liste"),
    path("admin/signalements/<int:pk>/", AdminSignalementStatusUpdateView.as_view(), name="admin_signalement_maj"),
]