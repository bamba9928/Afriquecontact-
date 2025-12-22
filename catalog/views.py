from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from catalog.models import Job, Location
from catalog.serializers import JobSerializer, LocationSerializer
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

class JobsListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = JobSerializer

    def get_queryset(self):
        qs = Job.objects.select_related("category").all().order_by("name")
        featured = self.request.query_params.get("featured")
        if featured in ("1", "true", "True"):
            qs = qs.filter(is_featured=True)
        return qs


class LocationsListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = LocationSerializer

    def get_queryset(self):
        qs = Location.objects.all().order_by("type", "name")
        parent = self.request.query_params.get("parent")
        if parent:
            qs = qs.filter(parent_id=parent)
        return qs

class FeaturedJobsView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = JobSerializer

    def get_queryset(self):
        return (
            Job.objects.select_related("category")
            .filter(is_featured=True)
            .order_by("name")
        )
class LocationsTreeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        Retourne l'arbre complet:
        [
          {id, name, slug, type, children:[...]}
        ]
        """
        rows = Location.objects.all().values("id", "name", "slug", "type", "parent_id")

        nodes = {}
        for r in rows:
            nodes[r["id"]] = {
                "id": r["id"],
                "name": r["name"],
                "slug": r["slug"],
                "type": r["type"],
                "children": [],
                "parent_id": r["parent_id"],
            }

        roots = []
        for node in nodes.values():
            pid = node["parent_id"]
            if pid and pid in nodes:
                nodes[pid]["children"].append(node)
            else:
                roots.append(node)

        # optionnel: tri par nom à chaque niveau
        def sort_tree(items):
            items.sort(key=lambda x: x["name"].lower())
            for it in items:
                sort_tree(it["children"])

        sort_tree(roots)

        # on retire parent_id du payload final
        def strip_parent_id(items):
            for it in items:
                it.pop("parent_id", None)
                strip_parent_id(it["children"])

        strip_parent_id(roots)
        return Response(roots)
