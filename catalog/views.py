from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Prefetch

from catalog.models import Job, Location, JobCategory
from catalog.serializers import JobSerializer, LocationSerializer, JobCategorySerializer


class JobsListView(generics.ListAPIView):
    """
    Liste les métiers avec support des filtres (featured) et optimisation SQL.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = JobSerializer

    def get_queryset(self):
        # Utilise select_related pour charger la catégorie et éviter le N+1
        qs = Job.objects.select_related("category").all().order_by("name")
        featured = self.request.query_params.get("featured")

        # Filtre pour les métiers "les plus recherchés" [cite: 188]
        if featured in ("1", "true", "True"):
            qs = qs.filter(is_featured=True)
        return qs

class FeaturedJobsView(generics.ListAPIView):
    """
    Vue dédiée pour retourner uniquement les métiers 'les plus recherchés'.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = JobSerializer

    def get_queryset(self):
        return (
            Job.objects.select_related("category")
            .filter(is_featured=True)
            .order_by("name")
        )
class JobCategoriesTreeView(APIView):
    """
    Retourne la hiérarchie complète des catégories et sous-catégories.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Récupère uniquement les racines et pré-charge les sous-catégories
        categories = JobCategory.objects.filter(parent__isnull=True).prefetch_related('subcategories')
        serializer = JobCategorySerializer(categories, many=True)
        return Response(serializer.data)


class LocationsListView(generics.ListAPIView):
    """
    Liste simple des localisations avec filtrage par parent.
    """
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
    Construit un arbre complet des localisations (Pays > Région > Ville > Quartier).
    Optimisé en une seule requête SQL.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        rows = Location.objects.all().values("id", "name", "slug", "type", "parent_id")
        nodes = {r["id"]: {**r, "children": []} for r in rows}
        roots = []

        for node in nodes.values():
            pid = node.pop("parent_id")
            if pid and pid in nodes:
                nodes[pid]["children"].append(node)
            else:
                roots.append(node)

        # Tri alphabétique récursif
        def sort_tree(items):
            items.sort(key=lambda x: x["name"].lower())
            for it in items:
                sort_tree(it["children"])

        sort_tree(roots)
        return Response(roots)