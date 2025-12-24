from __future__ import annotations

from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend

from .models import Annonce
from .serializers import AnnonceSerializer
from billing.models import Subscription
from pros.permissions import EstAdministrateur


class AnnonceCreateView(generics.CreateAPIView):
    """
    Création d'annonce :
    - DEMANDE : Gratuit pour tous.
    - OFFRE : Nécessite un abonnement actif (1000F).
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AnnonceSerializer

    def perform_create(self, serializer):
        type_annonce = self.request.data.get("type")

        # Règle métier : Seules les offres d'emploi sont payantes
        if type_annonce == Annonce.TypeAnnonce.OFFRE:
            # Vérification via la table Subscription
            sub = Subscription.objects.filter(
                user=self.request.user,
                status=Subscription.Status.ACTIVE
            ).first()

            if not sub or not sub.is_active():
                raise ValidationError({
                    "subscription": "Un abonnement actif est requis pour publier une offre d'emploi (1000F/mois)."
                })

        # L'annonce est créée mais 'est_approuvee' reste à False par défaut
        serializer.save(auteur=self.request.user)


class AnnoncePublicListView(generics.ListAPIView):
    """
    Liste publique des annonces validées avec recherche et filtrage.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = AnnonceSerializer

    # Configuration des filtres pour le mobile
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["type", "categorie", "zone_geographique"]
    search_fields = ["titre", "description"]
    ordering = ["-cree_le"]

    def get_queryset(self):
        # On ne montre que les annonces approuvées par la modération
        return Annonce.objects.filter(est_approuvee=True).select_related(
            "categorie", "auteur", "zone_geographique"
        )


class MesAnnoncesListView(generics.ListAPIView):
    """
    Permet à l'utilisateur de voir et gérer ses propres annonces.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AnnonceSerializer

    def get_queryset(self):
        return Annonce.objects.filter(auteur=self.request.user).order_by("-cree_le")


class AdminApprobationAnnonceView(generics.UpdateAPIView):
    """
    Vue réservée aux admins pour approuver ou rejeter une annonce.
    """
    permission_classes = [permissions.IsAuthenticated, EstAdministrateur]
    serializer_class = AnnonceSerializer
    queryset = Annonce.objects.all()

    def patch(self, request, *args, **kwargs):
        annonce = self.get_object()
        approbation = request.data.get("est_approuvee", False)

        annonce.est_approuvee = approbation
        annonce.save(update_fields=["est_approuvee"])

        status_msg = "approuvée" if approbation else "rejetée / masquée"
        return Response({"detail": f"Annonce {status_msg} avec succès."})