from __future__ import annotations

from typing import List

from django.db.models import Q
from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Job, Location, JobCategory

from catalog.serializers import (
    JobSerializer,
    LocationSerializer,
    JobCategoryTreeSerializer,
    # minimal
    JobMinimalSerializer,
    LocationMinimalSerializer,
    JobCategoryMinimalSerializer,
)

def build_prefetch_chain(rel: str, depth: int) -> List[str]:
    # ex: rel="subcategories", depth=3 =>
    # ["subcategories", "subcategories__subcategories", "subcategories__subcategories__subcategories"]
    depth = max(0, depth)
    return ["__".join([rel] * i) for i in range(1, depth + 1)]


class JobsListView(generics.ListAPIView):
    """
    Liste des métiers avec filtres et optimisation SQL.
    Params:
      - featured=1/true
      - category=<id|slug>
      - q=<search>
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = JobSerializer

    def get_queryset(self):
        qs = (
            Job.objects.select_related("category", "category__parent")
            .all()
            .order_by("name")
        )

        featured = self.request.query_params.get("featured")
        if featured in ("1", "true", "True"):
            qs = qs.filter(is_featured=True)

        category = self.request.query_params.get("category")
        if category:
            if category.isdigit():
                qs = qs.filter(category_id=int(category))
            else:
                qs = qs.filter(category__slug=category)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(category__name__icontains=q))

        return qs


class FeaturedJobsView(generics.ListAPIView):
    """
    Optionnel (redondant avec /jobs?featured=1).
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = JobSerializer

    def get_queryset(self):
        return (
            Job.objects.select_related("category", "category__parent")
            .filter(is_featured=True)
            .order_by("name")
        )


class JobCategoriesTreeView(APIView):
    """
    Retourne l'arbre des catégories.
    Param:
      - depth (int) : profondeur max (défaut 5, max 8)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        depth = request.query_params.get("depth", "5")
        try:
            depth_int = min(max(int(depth), 1), 8)
        except ValueError:
            raise ValidationError({"depth": "depth doit être un entier"})

        prefetches = build_prefetch_chain("subcategories", depth_int)

        categories = (
            JobCategory.objects.filter(parent__isnull=True)
            .prefetch_related(*prefetches)
            .order_by("name")
        )

        serializer = JobCategoryTreeSerializer(
            categories, many=True, context={"depth": depth_int}
        )
        return Response(serializer.data)


class LocationsListView(generics.ListAPIView):
    """
    Liste simple des localisations.
    Params:
      - parent=<id|slug> (si absent -> toutes)
      - type=COUNTRY|REGION|CITY|DISTRICT
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LocationSerializer

    def get_queryset(self):
        qs = Location.objects.all().order_by("type", "name")

        parent = self.request.query_params.get("parent")
        if parent:
            if parent.isdigit():
                qs = qs.filter(parent_id=int(parent))
            else:
                qs = qs.filter(parent__slug=parent)

        loc_type = self.request.query_params.get("type")
        if loc_type:
            qs = qs.filter(type=loc_type)

        return qs


class LocationsTreeView(APIView):
    """
    Arbre complet en 1 requête SQL.
    Params:
      - root=<id|slug> (si fourni -> retourne seulement ce sous-arbre)
      - depth (int) : limite profondeur (défaut 4, max 8)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        root = request.query_params.get("root")

        depth = request.query_params.get("depth", "4")
        try:
            depth_int = min(max(int(depth), 1), 8)
        except ValueError:
            raise ValidationError({"depth": "depth doit être un entier"})

        # 1 requête
        rows = list(Location.objects.all().values("id", "name", "slug", "type", "parent_id"))

        type_display_map = dict(Location.Type.choices)
        nodes = {
            r["id"]: {
                "id": r["id"],
                "name": r["name"],
                "slug": r["slug"],
                "type": r["type"],
                "type_display": type_display_map.get(r["type"], r["type"]),
                "children": [],
            }
            for r in rows
        }

        slug_to_id = {n["slug"]: nid for nid, n in nodes.items()}

        roots = []
        for r in rows:
            nid = r["id"]
            pid = r["parent_id"]
            if pid and pid in nodes:
                nodes[pid]["children"].append(nodes[nid])
            else:
                roots.append(nodes[nid])

        # tri + limit depth
        level_weight = {"COUNTRY": 0, "REGION": 1, "CITY": 2, "DISTRICT": 3}

        def trim_and_sort(node, depth_left: int):
            node["children"].sort(
                key=lambda x: (level_weight.get(x["type"], 99), x["name"].lower())
            )
            if depth_left <= 1:
                node["children"] = []
                return
            for ch in node["children"]:
                trim_and_sort(ch, depth_left - 1)

        roots.sort(key=lambda x: (level_weight.get(x["type"], 99), x["name"].lower()))
        for rt in roots:
            trim_and_sort(rt, depth_int)

        # sous-arbre
        if root:
            if root.isdigit():
                root_id = int(root)
            else:
                root_id = slug_to_id.get(root)
            if not root_id or root_id not in nodes:
                raise ValidationError({"root": "root introuvable (id ou slug)"} )

            # il faut re-trimmer depuis ce root (au cas où il était profond)
            subtree = nodes[root_id]
            trim_and_sort(subtree, depth_int)
            return Response(subtree)

        return Response(roots)

def build_prefetch_chain(rel: str, depth: int) -> List[str]:
    depth = max(0, depth)
    return ["__".join([rel] * i) for i in range(1, depth + 1)]


# -----------------------
# Jobs (list / featured)
# -----------------------
class JobsListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = JobSerializer

    def get_queryset(self):
        qs = (
            Job.objects.select_related("category", "category__parent")
            .all()
            .order_by("name")
        )

        featured = self.request.query_params.get("featured")
        if featured in ("1", "true", "True"):
            qs = qs.filter(is_featured=True)

        category = self.request.query_params.get("category")
        if category:
            if category.isdigit():
                qs = qs.filter(category_id=int(category))
            else:
                qs = qs.filter(category__slug=category)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(category__name__icontains=q))

        return qs


class FeaturedJobsView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = JobSerializer

    def get_queryset(self):
        return (
            Job.objects.select_related("category", "category__parent")
            .filter(is_featured=True)
            .order_by("name")
        )


# -----------------------
# Jobs - detail / search
# -----------------------
class JobDetailView(generics.RetrieveAPIView):
    """
    GET /jobs/<slug>/
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = JobSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Job.objects.select_related("category", "category__parent")


class JobsSearchView(generics.ListAPIView):
    """
    GET /jobs/search/?q=...&featured=1
    Réponse "minimal" pour autocomplete
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = JobMinimalSerializer

    def get_queryset(self):
        q = (self.request.query_params.get("q") or "").strip()
        if not q:
            # évite de renvoyer tout le catalogue si q vide
            return Job.objects.none()

        qs = Job.objects.select_related("category").filter(
            Q(name__icontains=q) | Q(category__name__icontains=q)
        )

        featured = self.request.query_params.get("featured")
        if featured in ("1", "true", "True"):
            qs = qs.filter(is_featured=True)

        return qs.order_by("name")[:50]


# -----------------------
# Categories - tree / detail / children
# -----------------------
class JobCategoriesTreeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        depth = request.query_params.get("depth", "5")
        try:
            depth_int = min(max(int(depth), 1), 8)
        except ValueError:
            raise ValidationError({"depth": "depth doit être un entier"})

        prefetches = build_prefetch_chain("subcategories", depth_int)

        categories = (
            JobCategory.objects.filter(parent__isnull=True)
            .prefetch_related(*prefetches)
            .order_by("name")
        )

        serializer = JobCategoryTreeSerializer(
            categories, many=True, context={"depth": depth_int}
        )
        return Response(serializer.data)


class JobCategoryDetailView(generics.RetrieveAPIView):
    """
    GET /categories/<slug>/
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = JobCategoryMinimalSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return JobCategory.objects.select_related("parent")


class JobCategoryChildrenView(generics.ListAPIView):
    """
    GET /categories/<slug>/children/
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = JobCategoryMinimalSerializer

    def get_queryset(self):
        slug = self.kwargs["slug"]
        try:
            parent = JobCategory.objects.only("id").get(slug=slug)
        except JobCategory.DoesNotExist:
            raise ValidationError({"slug": "Catégorie introuvable"})

        return JobCategory.objects.filter(parent_id=parent.id).order_by("name")


# -----------------------
# Locations - list / tree / detail / children / search
# -----------------------
class LocationsListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LocationSerializer

    def get_queryset(self):
        qs = Location.objects.all().order_by("type", "name")

        parent = self.request.query_params.get("parent")
        if parent:
            if parent.isdigit():
                qs = qs.filter(parent_id=int(parent))
            else:
                qs = qs.filter(parent__slug=parent)

        loc_type = self.request.query_params.get("type")
        if loc_type:
            qs = qs.filter(type=loc_type)

        return qs


class LocationsTreeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        root = request.query_params.get("root")

        depth = request.query_params.get("depth", "4")
        try:
            depth_int = min(max(int(depth), 1), 8)
        except ValueError:
            raise ValidationError({"depth": "depth doit être un entier"})

        rows = list(Location.objects.all().values("id", "name", "slug", "type", "parent_id"))

        type_display_map = dict(Location.Type.choices)
        nodes = {
            r["id"]: {
                "id": r["id"],
                "name": r["name"],
                "slug": r["slug"],
                "type": r["type"],
                "type_display": type_display_map.get(r["type"], r["type"]),
                "children": [],
            }
            for r in rows
        }

        slug_to_id = {n["slug"]: nid for nid, n in nodes.items()}

        roots = []
        for r in rows:
            nid = r["id"]
            pid = r["parent_id"]
            if pid and pid in nodes:
                nodes[pid]["children"].append(nodes[nid])
            else:
                roots.append(nodes[nid])

        level_weight = {"COUNTRY": 0, "REGION": 1, "CITY": 2, "DISTRICT": 3}

        def trim_and_sort(node, depth_left: int):
            node["children"].sort(
                key=lambda x: (level_weight.get(x["type"], 99), x["name"].lower())
            )
            if depth_left <= 1:
                node["children"] = []
                return
            for ch in node["children"]:
                trim_and_sort(ch, depth_left - 1)

        roots.sort(key=lambda x: (level_weight.get(x["type"], 99), x["name"].lower()))
        for rt in roots:
            trim_and_sort(rt, depth_int)

        if root:
            if root.isdigit():
                root_id = int(root)
            else:
                root_id = slug_to_id.get(root)
            if not root_id or root_id not in nodes:
                raise ValidationError({"root": "root introuvable (id ou slug)"})

            subtree = nodes[root_id]
            trim_and_sort(subtree, depth_int)
            return Response(subtree)

        return Response(roots)


class LocationDetailView(generics.RetrieveAPIView):
    """
    GET /locations/<slug>/
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LocationSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Location.objects.select_related("parent")


class LocationChildrenView(generics.ListAPIView):
    """
    GET /locations/<slug>/children/?type=CITY
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LocationMinimalSerializer

    def get_queryset(self):
        slug = self.kwargs["slug"]
        try:
            parent = Location.objects.only("id").get(slug=slug)
        except Location.DoesNotExist:
            raise ValidationError({"slug": "Location introuvable"})

        qs = Location.objects.filter(parent_id=parent.id)

        loc_type = self.request.query_params.get("type")
        if loc_type:
            qs = qs.filter(type=loc_type)

        return qs.order_by("type", "name")


class LocationsSearchView(generics.ListAPIView):
    """
    GET /locations/search/?q=...&type=CITY
    Réponse "minimal" pour autocomplete
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LocationMinimalSerializer

    def get_queryset(self):
        q = (self.request.query_params.get("q") or "").strip()
        if not q:
            return Location.objects.none()

        qs = Location.objects.filter(name__icontains=q)

        loc_type = self.request.query_params.get("type")
        if loc_type:
            qs = qs.filter(type=loc_type)

        parent = self.request.query_params.get("parent")
        if parent:
            if parent.isdigit():
                qs = qs.filter(parent_id=int(parent))
            else:
                qs = qs.filter(parent__slug=parent)

        return qs.order_by("type", "name")[:50]

