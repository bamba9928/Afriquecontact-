"""
Views pour les profils professionnels
Gestion des recherches, publications, favoris et médias
"""
from __future__ import annotations

from typing import Optional

from django.db.models import (
    F,
    FloatField,
    Value,
    ExpressionWrapper,
    Prefetch,
    OuterRef,
    Exists,
    Q,
)
from django.db.models.functions import Radians, Sin, Cos, ACos, Greatest, Least
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from billing.models import Subscription
from .models import ProfilProfessionnel, ContactFavori, MediaPro
from .serializers import (
    ProMeSerializer,
    ProPublicSerializer,        # Détail (avec medias)
    ProPublicListSerializer,    # Liste (sans medias)
    ContactFavoriSerializer,
    MediaProSerializer,
)
from .permissions import EstProfessionnel, EstAdministrateur


# ============================================================================
# PAGINATION
# ============================================================================

class PaginationRecherchePro(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# ============================================================================
# HELPERS
# ============================================================================

def _active_subscription_subquery(now_dt):
    return Subscription.objects.filter(
        user_id=OuterRef("utilisateur_id"),
        status=Subscription.Status.ACTIVE,
        end_at__gt=now_dt,
    )


def _annotate_active_subscription(qs, now_dt):
    return qs.annotate(has_active_subscription=Exists(_active_subscription_subquery(now_dt)))


# ============================================================================
# VUES PUBLIQUES
# ============================================================================

class RechercheProView(generics.ListAPIView):
    """
    Recherche (LIST) optimisée mobile:
    - uniquement profils publiés + abonnement actif
    - serializer léger (sans medias)
    - photo_couverture: prefetch uniquement PHOTOS
    - distance_km: annotée si lat/lng fournis
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = ProPublicListSerializer
    pagination_class = PaginationRecherchePro

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["metier", "zone_geographique", "statut_en_ligne"]
    search_fields = ["nom_entreprise", "description"]
    ordering_fields = ["cree_le", "mis_a_jour_le"]
    ordering = ["-mis_a_jour_le"]

    def get_queryset(self):
        now_dt = now()

        qs = (
            ProfilProfessionnel.objects
            .select_related("utilisateur", "metier", "zone_geographique")
        )
        qs = _annotate_active_subscription(qs, now_dt).filter(est_publie=True, has_active_subscription=True)

        # Précharge seulement les PHOTOS (pour photo_couverture) => léger
        qs = qs.prefetch_related(
            Prefetch(
                "media",
                queryset=MediaPro.objects.filter(type_media=MediaPro.TypeMedia.PHOTO).only(
                    "id", "professionnel_id", "type_media", "est_principal", "fichier", "cree_le"
                ),
            )
        )

        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        tri = self.request.query_params.get("sort")
        rayon_km = self.request.query_params.get("radius_km")

        if lat and lng:
            try:
                lat_f = float(lat)
                lng_f = float(lng)

                if not (-90 <= lat_f <= 90 and -180 <= lng_f <= 180):
                    return qs

                qs = qs.exclude(latitude__isnull=True).exclude(longitude__isnull=True)

                # Spherical law of cosines + clamp [-1, 1]
                cos_val = (
                    Cos(Radians(Value(lat_f))) * Cos(Radians(F("latitude"))) *
                    Cos(Radians(F("longitude")) - Radians(Value(lng_f))) +
                    Sin(Radians(Value(lat_f))) * Sin(Radians(F("latitude")))
                )
                cos_val_clamped = Least(Value(1.0), Greatest(Value(-1.0), cos_val))

                distance_expr = ExpressionWrapper(
                    Value(6371.0) * ACos(cos_val_clamped),
                    output_field=FloatField(),
                )

                qs = qs.annotate(distance_km=distance_expr)

                if rayon_km:
                    try:
                        r = float(rayon_km)
                        if r > 0:
                            qs = qs.filter(distance_km__lte=r)
                    except (ValueError, TypeError):
                        pass

                if tri == "distance":
                    qs = qs.order_by("distance_km", "-mis_a_jour_le")

            except (ValueError, TypeError):
                pass

        return qs


class ProPublicDetailView(generics.RetrieveAPIView):
    """
    Détail public (DETAIL):
    - Public: est_publie=True + abonnement actif
    - Propriétaire: voit toujours son profil
    - serializer complet (avec medias)
    - prefetch: TOUS les médias
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = ProPublicSerializer
    lookup_field = "slug"

    def get_queryset(self):
        now_dt = now()

        qs = (
            ProfilProfessionnel.objects
            .select_related("metier", "zone_geographique", "utilisateur")
        )
        qs = _annotate_active_subscription(qs, now_dt)

        # Galerie complète
        qs = qs.prefetch_related(
            Prefetch(
                "media",
                queryset=MediaPro.objects.only(
                    "id", "professionnel_id", "type_media", "est_principal", "fichier", "cree_le"
                ).order_by("-est_principal", "type_media", "cree_le"),
            )
        )

        user = getattr(self.request, "user", None)
        if user and user.is_authenticated:
            return qs.filter(Q(utilisateur=user) | Q(est_publie=True, has_active_subscription=True))

        return qs.filter(est_publie=True, has_active_subscription=True)


# ============================================================================
# VUES PROFESSIONNELLES (DASHBOARD)
# ============================================================================

class MonProfilProView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, EstProfessionnel]
    serializer_class = ProMeSerializer

    def get_object(self):
        return get_object_or_404(ProfilProfessionnel, utilisateur=self.request.user)


class PublicationProView(APIView):
    """
    Publie le profil si:
    - WhatsApp vérifié
    - abonnement actif
    - profil complet
    """
    permission_classes = [permissions.IsAuthenticated, EstProfessionnel]

    def _abonnement_actif(self, user) -> bool:
        return Subscription.objects.filter(
            user=user,
            status=Subscription.Status.ACTIVE,
            end_at__gt=now(),
        ).exists()

    def post(self, request):
        pro = get_object_or_404(ProfilProfessionnel, utilisateur=request.user)

        if not getattr(request.user, "whatsapp_verified", False):
            return Response(
                {"detail": "Vérifiez votre WhatsApp avant de publier."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not self._abonnement_actif(request.user):
            return Response(
                {"detail": "Abonnement inactif. Veuillez régler 1000F/mois pour être visible."},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        champs_obligatoires = [
            pro.nom_entreprise,
            pro.telephone_appel,
            pro.telephone_whatsapp,
            pro.metier_id,
            pro.zone_geographique_id,
        ]
        if not all(champs_obligatoires):
            return Response(
                {"detail": "Profil incomplet pour publication."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pro.est_publie = True
        pro.save(update_fields=["est_publie"])
        return Response({"detail": "Votre profil est désormais visible.", "slug": pro.slug})


class RetraitPublicationProView(APIView):
    permission_classes = [permissions.IsAuthenticated, EstProfessionnel]

    def post(self, request):
        pro = get_object_or_404(ProfilProfessionnel, utilisateur=request.user)
        pro.est_publie = False
        pro.save(update_fields=["est_publie"])
        return Response({"detail": "Profil masqué avec succès.", "est_publie": False})


# ============================================================================
# VUES ADMINISTRATION
# ============================================================================

class AdminPublicationProView(APIView):
    permission_classes = [permissions.IsAuthenticated, EstAdministrateur]

    def post(self, request, pro_id: int):
        pro = get_object_or_404(ProfilProfessionnel, pk=pro_id)
        pro.est_publie = True
        pro.save(update_fields=["est_publie"])
        return Response({"detail": "Profil publié par l'administrateur.", "professionnel_id": pro.id, "slug": pro.slug})


class AdminRetraitPublicationProView(APIView):
    permission_classes = [permissions.IsAuthenticated, EstAdministrateur]

    def post(self, request, pro_id: int):
        pro = get_object_or_404(ProfilProfessionnel, pk=pro_id)
        pro.est_publie = False
        pro.save(update_fields=["est_publie"])
        return Response({"detail": "Profil dépublié par l'administrateur.", "professionnel_id": pro.id})


# ============================================================================
# VUES MÉDIAS
# ============================================================================

class MediaProCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated, EstProfessionnel]
    serializer_class = MediaProSerializer

    def perform_create(self, serializer):
        serializer.save(professionnel=self.request.user.pro_profile)


# ============================================================================
# VUES FAVORIS
# ============================================================================

class ContactFavoriView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ContactFavoriSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ContactFavori.objects.none()

        if not self.request.user.is_authenticated:
            return ContactFavori.objects.none()

        return (
            ContactFavori.objects
            .select_related(
                "professionnel",
                "professionnel__utilisateur",
                "professionnel__metier",
                "professionnel__zone_geographique",
            )
            .prefetch_related("professionnel__media")
            .filter(proprietaire=self.request.user)
            .order_by("-id")
        )

    def perform_create(self, serializer):
        serializer.save(proprietaire=self.request.user)


class ContactFavoriDestroyView(generics.DestroyAPIView):
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
