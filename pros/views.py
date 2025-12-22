from __future__ import annotations
from django.db.models import F, FloatField, Value, ExpressionWrapper
from django.db.models.functions import Radians, Sin, Cos, ACos
from django.utils.timezone import now
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import ProfilProfessionnel
from .serializers import ProMeSerializer, ProPublicSerializer
from .permissions import EstProfessionnel, EstAdministrateur


# --- Pagination ---

class PaginationRecherchePro(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# --- Vues Publiques ---

class RechercheProView(generics.ListAPIView):
    """
    Vue de recherche optimisée :
    - Filtres : métier, localisation, statut en ligne via DjangoFilter
    - Recherche textuelle : nom d'entreprise, description
    - Géo-distance : calculée en SQL si lat/lng fournis
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = ProPublicSerializer
    pagination_class = PaginationRecherchePro

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["metier", "zone_geographique", "statut_en_ligne"]
    search_fields = ["nom_entreprise", "description"]
    ordering_fields = ["cree_le", "mis_a_jour_le"]
    ordering = ["-mis_a_jour_le"]

    def get_queryset(self):
        # Utilisation de select_related pour optimiser les jointures
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

                # Exclusion des profils sans coordonnées
                qs = qs.exclude(latitude__isnull=True).exclude(longitude__isnull=True)

                # Formule SQL de distance (Loi des cosinus)
                #
                distance_expr = ExpressionWrapper(
                    Value(6371.0) * ACos(
                        Cos(Radians(Value(lat_f))) * Cos(Radians(F("latitude"))) *
                        Cos(Radians(F("longitude")) - Radians(Value(lng_f))) +
                        Sin(Radians(Value(lat_f))) * Sin(Radians(F("latitude")))
                    ),
                    output_field=FloatField(),
                )

                qs = qs.annotate(distance_km=distance_expr)

                # Filtrage par rayon
                if rayon_km:
                    qs = qs.filter(distance_km__lte=float(rayon_km))

                # Tri par proximité
                if tri == "distance":
                    qs = qs.order_by("distance_km")

            except (ValueError, TypeError):
                pass

        return qs


# --- Vues Professionnelles (Gestion de soi) ---

class MonProfilProView(generics.RetrieveUpdateAPIView):
    """
    Permet au pro de voir et modifier son propre profil.
    """
    permission_classes = [permissions.IsAuthenticated, EstProfessionnel]
    serializer_class = ProMeSerializer

    def get_object(self):
        return self.request.user.pro_profile


class PublicationProView(APIView):
    """
    Action pour rendre le profil visible publiquement.
    """
    permission_classes = [permissions.IsAuthenticated, EstProfessionnel]

    def post(self, request):
        pro = request.user.pro_profile

        if not request.user.whatsapp_verified:
            return Response(
                {"detail": "Vérifiez votre WhatsApp avant de publier."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérification des champs obligatoires
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
    """
    Action pour masquer le profil du public.
    """
    permission_classes = [permissions.IsAuthenticated, EstProfessionnel]

    def post(self, request):
        pro = request.user.pro_profile
        pro.est_publie = False
        pro.save(update_fields=["est_publie"])
        return Response({"detail": "Profil masqué avec succès."})


# --- Vues Administration ---

class AdminPublicationProView(APIView):
    """
    L'admin force la publication d'un profil.
    """
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
    """
    L'admin masque un profil (ex: suite à un signalement).
    """
    permission_classes = [permissions.IsAuthenticated, EstAdministrateur]

    def post(self, request, pro_id: int):
        try:
            pro = ProfilProfessionnel.objects.get(pk=pro_id)
            pro.est_publie = False
            pro.save(update_fields=["est_publie"])
            return Response({"detail": "Profil dépublié par l'administrateur."})
        except ProfilProfessionnel.DoesNotExist:
            return Response({"detail": "Profil introuvable."}, status=status.HTTP_404_NOT_FOUND)