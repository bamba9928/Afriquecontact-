from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny

from catalog.models import Job, Location
from catalog.serializers import JobSerializer, LocationSerializer


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
