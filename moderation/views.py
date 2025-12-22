from __future__ import annotations

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, filters

from moderation.models import Signalement
from moderation.serializers import (
    SignalementCreateSerializer,
    SignalementSerializer,
    SignalementStatusUpdateSerializer,
)
from pros.permissions import EstAdministrateur  # Adapté selon votre logique de permissions


class SignalementCreateView(generics.CreateAPIView):
    """
    Vue pour permettre à un utilisateur authentifié de créer un signalement.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SignalementCreateSerializer


class MesSignalementsListView(generics.ListAPIView):
    """
    Vue permettant à l'utilisateur de voir l'historique de ses propres signalements.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SignalementSerializer

    def get_queryset(self):
        return Signalement.objects.select_related("professionnel", "auteur").filter(
            auteur=self.request.user
        )


class AdminSignalementsListView(generics.ListAPIView):
    """
    Vue réservée aux administrateurs pour lister et filtrer tous les signalements.
    """
    permission_classes = [permissions.IsAuthenticated, EstAdministrateur]
    serializer_class = SignalementSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["statut", "professionnel", "auteur"]
    ordering_fields = ["cree_le", "traite_le", "statut"]
    ordering = ["-cree_le"]

    def get_queryset(self):
        return Signalement.objects.select_related("professionnel", "auteur", "traite_par")


class AdminSignalementStatusUpdateView(generics.UpdateAPIView):
    """
    Vue permettant aux administrateurs de traiter un signalement et de mettre à jour son statut.
    """
    permission_classes = [permissions.IsAuthenticated, EstAdministrateur]
    serializer_class = SignalementStatusUpdateSerializer
    queryset = Signalement.objects.all()

    def perform_update(self, serializer):
        # Sauvegarde du nouveau statut
        signalement = serializer.save()

        # Logique de gestion du traitement automatique
        if signalement.statut != Signalement.Statut.OUVERT:
            signalement.traite_par = self.request.user
            signalement.traite_le = timezone.now()
        else:
            # Si le statut revient à "Ouvert", on réinitialise les infos de traitement
            signalement.traite_par = None
            signalement.traite_le = None

        signalement.save(update_fields=["traite_par", "traite_le"])