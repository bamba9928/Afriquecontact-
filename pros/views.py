from django.db.models import F, FloatField, Value, ExpressionWrapper
from django.db.models.functions import Radians, Sin, Cos, ACos
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import ProfessionalProfile
from .serializers import ProMeSerializer, ProPublicSerializer
from .permissions import IsProUser, IsAdminUserRole


# --- Pagination ---

class ProSearchPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# --- Vues Publiques ---

class ProSearchView(generics.ListAPIView):
    """
    Vue de recherche optimisée :
    - Filtres : job, location, online_status via DjangoFilter
    - Recherche textuelle : business_name, description
    - Géo-distance : calculée en SQL si lat/lng fournis
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = ProPublicSerializer
    pagination_class = ProSearchPagination

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["job", "location", "online_status"]
    search_fields = ["business_name", "description"]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        # On utilise select_related pour éviter les requêtes N+1 sur User, Job et Location
        qs = ProfessionalProfile.objects.select_related("user", "job", "location").filter(is_published=True)

        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        sort = self.request.query_params.get("sort")
        radius_km = self.request.query_params.get("radius_km")

        if lat and lng:
            try:
                lat_f = float(lat)
                lng_f = float(lng)

                # On exclut les profils sans coordonnées pour le calcul géo
                qs = qs.exclude(lat__isnull=True).exclude(lng__isnull=True)

                # Formule SQL de distance (Spherical Law of Cosines)
                # Note : Vérifiez si vos champs s'appellent 'lat'/'lng' ou 'latitude'/'longitude'
                distance_expr = ExpressionWrapper(
                    Value(6371.0) * ACos(
                        Cos(Radians(Value(lat_f))) * Cos(Radians(F("lat"))) *
                        Cos(Radians(F("lng")) - Radians(Value(lng_f))) +
                        Sin(Radians(Value(lat_f))) * Sin(Radians(F("lat")))
                    ),
                    output_field=FloatField(),
                )

                qs = qs.annotate(distance_km=distance_expr)

                # Filtrage par rayon si demandé
                if radius_km:
                    qs = qs.filter(distance_km__lte=float(radius_km))

                # Tri par distance si demandé
                if sort == "distance":
                    qs = qs.order_by("distance_km")

            except (ValueError, TypeError):
                pass  # Si lat/lng invalides, on ignore le calcul géo

        return qs


# --- Vues Professionnelles (Self) ---

class ProMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsProUser]
    serializer_class = ProMeSerializer

    def get_object(self):
        return self.request.user.pro_profile


class ProPublishView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsProUser]

    def post(self, request):
        pro = request.user.pro_profile

        if not request.user.whatsapp_verified:
            return Response({"detail": "Vérifiez votre WhatsApp avant de publier."}, status=status.HTTP_400_BAD_REQUEST)

        # Vérification des champs obligatoires pour la publication
        required_fields = [pro.business_name, pro.call_phone, pro.whatsapp_phone, pro.job, pro.location]
        if not all(required_fields):
            return Response({"detail": "Profil incomplet (Nom, Téléphone, Métier ou Ville manquant)."},
                            status=status.HTTP_400_BAD_REQUEST)

        pro.is_published = True
        pro.save(update_fields=["is_published"])
        return Response({"detail": "Votre profil est désormais visible publiquement."})


class ProUnpublishView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsProUser]

    def post(self, request):
        pro = request.user.pro_profile
        pro.is_published = False
        pro.save(update_fields=["is_published"])
        return Response({"detail": "Profil masqué."})


# --- Vues Administration ---

class AdminProPublishView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def post(self, request, pro_id: int):
        try:
            pro = ProfessionalProfile.objects.get(pk=pro_id)
            pro.is_published = True
            pro.save(update_fields=["is_published"])
            return Response({"detail": "Profil publié par l'administrateur."})
        except ProfessionalProfile.DoesNotExist:
            return Response({"detail": "Profil introuvable."}, status=status.HTTP_404_NOT_FOUND)


class AdminProUnpublishView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def post(self, request, pro_id: int):
        try:
            pro = ProfessionalProfile.objects.get(pk=pro_id)
            pro.is_published = False
            pro.save(update_fields=["is_published"])
            return Response({"detail": "Profil dépublié par l'administrateur."})
        except ProfessionalProfile.DoesNotExist:
            return Response({"detail": "Profil introuvable."}, status=status.HTTP_404_NOT_FOUND)