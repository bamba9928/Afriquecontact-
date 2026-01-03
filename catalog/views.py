from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Prefetch

from catalog.models import Job, Location, JobCategory
from catalog.serializers import (
    JobSerializer,
    LocationSerializer,
    JobCategorySerializer,
    LocationTreeSerializer,
)


class JobsListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = JobSerializer

    def get_queryset(self):
        qs = Job.objects.select_related("category").all().order_by("name")
        featured = self.request.query_params.get("featured")
        if featured in ("1", "true", "True"):
            qs = qs.filter(is_featured=True)
        return qs


class FeaturedJobsView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = JobSerializer

    def get_queryset(self):
        return Job.objects.select_related("category").filter(is_featured=True).order_by("name")


class JobCategoriesTreeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        categories = JobCategory.objects.filter(parent__isnull=True).prefetch_related("subcategories")
        serializer = JobCategorySerializer(categories, many=True)
        return Response(serializer.data)


class LocationsListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LocationSerializer

    def get_queryset(self):
        qs = Location.objects.all().order_by("type", "name")
        parent = self.request.query_params.get("parent")
        if parent:
            qs = qs.filter(parent_id=parent)
        return qs

class LocationsTreeView(APIView):
    """
    Récupère l'arbre complet : REGION -> DEPARTMENT -> CITY -> DISTRICT
    Le Frontend se chargera d'ignorer le niveau CITY pour l'affichage si besoin.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # 1. Préparer les Districts (Quartiers)
        districts_qs = (
            Location.objects.filter(type=Location.Type.DISTRICT)
            .only("id", "name", "slug", "type", "parent_id")
            .order_by("name")
        )

        # 2. Préparer les Villes (Cities) en incluant leurs Districts
        cities_qs = (
            Location.objects.filter(type=Location.Type.CITY)
            .only("id", "name", "slug", "type", "parent_id")
            .prefetch_related(
                Prefetch(
                    "children",
                    queryset=districts_qs,
                    to_attr="children_filtered" # Utilisé par le serializer
                )
            )
            .order_by("name")
        )

        # 3. Préparer les Départements en incluant les Villes
        departments_qs = (
            Location.objects.filter(type=Location.Type.DEPARTMENT)
            .only("id", "name", "slug", "type", "parent_id")
            .prefetch_related(
                Prefetch(
                    "children",
                    queryset=cities_qs,
                    to_attr="children_filtered"
                )
            )
            .order_by("name")
        )

        # 4. Préparer les Régions en incluant les Départements
        regions_qs = (
            Location.objects.filter(type=Location.Type.REGION)
            .only("id", "name", "slug", "type", "parent_id")
            .prefetch_related(
                Prefetch(
                    "children",
                    queryset=departments_qs,
                    to_attr="children_filtered"
                )
            )
            .order_by("name")
        )

        # Filtrer par pays (facultatif mais propre)
        senegal = Location.objects.filter(type=Location.Type.COUNTRY, slug="senegal").first()
        if senegal:
            regions_qs = regions_qs.filter(parent=senegal)

        # Sérialisation
        data = LocationTreeSerializer(regions_qs, many=True).data
        return Response(data)
