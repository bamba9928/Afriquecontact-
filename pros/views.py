from __future__ import annotations

from django.db.models import F, FloatField, Value, ExpressionWrapper
from django.db.models.functions import Radians, Sin, Cos, ACos
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import ProfilProfessionnel, ContactFavori
from .serializers import ProMeSerializer, ProPublicSerializer, ContactFavoriSerializer, MediaProSerializer
from .permissions import EstProfessionnel, EstAdministrateur


# --- Pagination ---

class PaginationRecherchePro(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# --- Vues Publiques ---

class RechercheProView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProPublicSerializer
    pagination_class = PaginationRecherchePro

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["metier", "zone_geographique", "statut_en_ligne"]
    search_fields = ["nom_entreprise", "description"]
    ordering_fields = ["cree_le", "mis_a_jour_le"]
    ordering = ["-mis_a_jour_le"]

    def get_queryset(self):
        qs = ProfilProfessionnel.objects.select_related(
            "utilisateur", "metier", "zone_geographique"
        ).filter(est_publie=True)

        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        tri = self.request.query_params.get("sort")
        rayon_km = self.request.query_params.get("radius_km")

        if lat and lng:
            try:
                lat_f = float(lat)
                lng_f = float(lng)

                qs = qs.exclude(latitude__isnull=True).exclude(longitude__isnull=True)

                distance_expr = ExpressionWrapper(
                    Value(6371.0) * ACos(
                        Cos(Radians(Value(lat_f))) * Cos(Radians(F("latitude"))) *
                        Cos(Radians(F("longitude")) - Radians(Value(lng_f))) +
                        Sin(Radians(Value(lat_f))) * Sin(Radians(F("latitude")))
                    ),
                    output_field=FloatField(),
                )

                qs = qs.annotate(distance_km=distance_expr)

                if rayon_km:
                    qs = qs.filter(distance_km__lte=float(rayon_km))

                if tri == "distance":
                    qs = qs.order_by("distance_km")

            except (ValueError, TypeError):
                pass

        return qs


# --- Vues Professionnelles (Gestion de soi) ---

class MonProfilProView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, EstProfessionnel]
    serializer_class = ProMeSerializer

    def get_object(self):
        return self.request.user.pro_profile


class PublicationProView(APIView):
    """
    Action pour rendre le profil visible publiquement.
    Règle: publication possible uniquement si abonnement/paiement actif (1000F/mois).
    """
    permission_classes = [permissions.IsAuthenticated, EstProfessionnel]

    def _abonnement_actif(self, pro, user) -> bool:
        """
        Adapte cette logique à ton modèle réel d'abonnement/paiement.
        Patterns supportés (si existants) :
          - pro.abonnement_actif (bool)
          - pro.abonnement_expire_le (date/datetime)
          - user.abonnement.est_actif / user.abonnement.expire_le
        """
        if hasattr(pro, "abonnement_actif"):
            return bool(getattr(pro, "abonnement_actif"))

        if hasattr(pro, "abonnement_expire_le"):
            expire_le = getattr(pro, "abonnement_expire_le")
            if expire_le is None:
                return False
            # expire_le peut être date ou datetime
            try:
                return expire_le >= now()
            except TypeError:
                return expire_le >= now().date()

        if hasattr(user, "abonnement") and user.abonnement is not None:
            abo = user.abonnement
            if hasattr(abo, "est_actif"):
                return bool(abo.est_actif)
            if hasattr(abo, "expire_le"):
                expire_le = abo.expire_le
                if expire_le is None:
                    return False
                try:
                    return expire_le >= now()
                except TypeError:
                    return expire_le >= now().date()

        return False

    def post(self, request):
        pro = request.user.pro_profile

        if not request.user.whatsapp_verified:
            return Response(
                {"detail": "Vérifiez votre WhatsApp avant de publier."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Vérification abonnement actif (1000F/mois)
        if not self._abonnement_actif(pro, request.user):
            return Response(
                {"detail": "Abonnement inactif. Veuillez régler 1000F/mois pour publier votre profil."},
                status=status.HTTP_402_PAYMENT_REQUIRED,  # ou 403 si tu préfères
            )

        champs_obligatoires = [
            pro.nom_entreprise, pro.telephone_appel,
            pro.telephone_whatsapp, pro.metier, pro.zone_geographique
        ]
        if not all(champs_obligatoires):
            return Response(
                {"detail": "Profil incomplet (Nom, Téléphone, Métier ou Ville manquant)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        pro.est_publie = True
        pro.save(update_fields=["est_publie"])
        return Response({"detail": "Votre profil est désormais visible publiquement."})


class RetraitPublicationProView(APIView):
    permission_classes = [permissions.IsAuthenticated, EstProfessionnel]

    def post(self, request):
        pro = request.user.pro_profile
        pro.est_publie = False
        pro.save(update_fields=["est_publie"])
        return Response({"detail": "Profil masqué avec succès."})


# --- Vues Administration ---

class AdminPublicationProView(APIView):
    permission_classes = [permissions.IsAuthenticated, EstAdministrateur]

    def post(self, request, pro_id: int):
        try:
            pro = ProfilProfessionnel.objects.get(pk=pro_id)
            pro.est_publie = True
            pro.save(update_fields=["est_publie"])
            return Response({"detail": "Profil publié par l'administrateur."})
        except ProfilProfessionnel.DoesNotExist:
            return Response({"detail": "Profil introuvable."}, status=status.HTTP_404_NOT_FOUND)


class AdminRetraitPublicationProView(APIView):
    permission_classes = [permissions.IsAuthenticated, EstAdministrateur]

    def post(self, request, pro_id: int):
        try:
            pro = ProfilProfessionnel.objects.get(pk=pro_id)
            pro.est_publie = False
            pro.save(update_fields=["est_publie"])
            return Response({"detail": "Profil dépublié par l'administrateur."},)
        except ProfilProfessionnel.DoesNotExist:
            return Response({"detail": "Profil introuvable."}, status=status.HTTP_404_NOT_FOUND)


class MediaProCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated, EstProfessionnel]
    serializer_class = MediaProSerializer

    def perform_create(self, serializer):
        serializer.save(professionnel=self.request.user.pro_profile)


class ContactFavoriView(generics.ListCreateAPIView):
    """
    Endpoint: /api/pro/favoris/
    - Optimisé avec select_related pour éviter N+1
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ContactFavoriSerializer

    def get_queryset(self):
        # ✅ Optimisation: on joint le professionnel et ses détails
        return (
            ContactFavori.objects
            .select_related(
                "professionnel",
                "professionnel__utilisateur",
                "professionnel__metier",
                "professionnel__zone_geographique",
            )
            .filter(proprietaire=self.request.user)
            .order_by("-id")
        )

    def perform_create(self, serializer):
        # Optionnel: éviter doublons si contrainte unique pas encore en place
        serializer.save(proprietaire=self.request.user)


class ContactFavoriDestroyView(generics.DestroyAPIView):
    """
    Endpoint (exemple): DELETE /api/pro/favoris/<int:professionnel_id>/
    Supprime un favori du user connecté.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ContactFavoriSerializer
    lookup_url_kwarg = "professionnel_id"

    def get_queryset(self):
        return ContactFavori.objects.filter(proprietaire=self.request.user)

    def get_object(self):
        return get_object_or_404(
            self.get_queryset(),
            professionnel_id=self.kwargs.get(self.lookup_url_kwarg),
        )
