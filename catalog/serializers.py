from rest_framework import serializers
from catalog.models import Job, JobCategory, Location
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions


class JobCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCategory
        fields = ["id", "name", "slug"]


class JobSerializer(serializers.ModelSerializer):
    category = JobCategorySerializer()

    class Meta:
        model = Job
        fields = ["id", "name", "slug", "is_featured", "category"]


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "name", "type", "slug", "parent"]

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
