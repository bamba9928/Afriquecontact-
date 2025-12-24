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
from pros.permissions import EstAdministrateur


class SignalementCreateView(generics.CreateAPIView):
    """
    Vue pour permettre à un client de signaler un pro (E1).
    L'auteur est automatiquement défini sur l'utilisateur connecté.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SignalementCreateSerializer

    def perform_create(self, serializer):
        # On injecte l'auteur automatiquement à la création
        serializer.save(auteur=self.request.user)


class MesSignalementsListView(generics.ListAPIView):
    """
    Historique personnel des signalements envoyés par l'utilisateur.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SignalementSerializer

    def get_queryset(self):
        return Signalement.objects.select_related("professionnel", "auteur").filter(
            auteur=self.request.user
        ).order_by("-cree_le")


class AdminSignalementsListView(generics.ListAPIView):
    """
    Interface Admin pour lister et filtrer tous les signalements (E2).
    """
    permission_classes = [permissions.IsAuthenticated, EstAdministrateur]
    serializer_class = SignalementSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]

    # Filtrage par statut (Ouvert/En cours/Résolu) et recherche par nom d'entreprise
    filterset_fields = ["statut", "raison"]
    search_fields = ["professionnel__nom_entreprise", "message"]
    ordering_fields = ["cree_le", "traite_le"]
    ordering = ["-cree_le"]

    def get_queryset(self):
        # Utilisation de select_related pour optimiser la base de données
        return Signalement.objects.select_related(
            "professionnel",
            "auteur",
            "traite_par"
        ).all()


class AdminSignalementStatusUpdateView(generics.UpdateAPIView):
    """
    Traitement des signalements par l'administrateur (E2/E3).
    Enregistre qui a traité le signalement et à quel moment.
    """
    permission_classes = [permissions.IsAuthenticated, EstAdministrateur]
    serializer_class = SignalementStatusUpdateSerializer
    queryset = Signalement.objects.all()

    def perform_update(self, serializer):
        # On sauvegarde les changements (statut et note_admin)
        signalement = serializer.save()

        # Si le statut change vers un état traité, on marque l'admin et la date
        if signalement.statut != Signalement.Statut.OUVERT:
            signalement.traite_par = self.request.user
            signalement.traite_le = timezone.now()
        else:
            # Réinitialisation si l'admin décide de remettre le dossier en "Ouvert"
            signalement.traite_par = None
            signalement.traite_le = None

        signalement.save(update_fields=["traite_par", "traite_le"])