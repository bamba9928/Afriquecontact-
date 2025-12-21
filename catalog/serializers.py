from rest_framework import serializers
from catalog.models import Job, JobCategory, Location


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
