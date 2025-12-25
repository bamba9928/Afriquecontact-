# catalog/serializers.py
from __future__ import annotations

from rest_framework import serializers
from catalog.models import Job, JobCategory, Location


class JobCategoryTreeSerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = JobCategory
        fields = ["id", "name", "slug", "parent", "subcategories"]

    def get_subcategories(self, obj):
        depth = int(self.context.get("depth", 5))
        if depth <= 1:
            return []
        children = obj.subcategories.all()
        return JobCategoryTreeSerializer(
            children, many=True, context={**self.context, "depth": depth - 1}
        ).data


class JobSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    full_category_path = serializers.StringRelatedField(source="category", read_only=True)

    class Meta:
        model = Job
        fields = ["id", "name", "slug", "is_featured", "category", "category_name", "full_category_path"]


class LocationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Location
        fields = ["id", "name", "type", "type_display", "slug", "parent"]


# ---- Serializers "minimal" (listes légères) ----
class LocationMinimalSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Location
        fields = ["id", "name", "type", "type_display", "slug", "parent"]


class JobCategoryMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCategory
        fields = ["id", "name", "slug", "parent"]


class JobMinimalSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)

    class Meta:
        model = Job
        fields = ["id", "name", "slug", "is_featured", "category", "category_name", "category_slug"]
class JobCategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source="parent.name", read_only=True)

    class Meta:
        model = JobCategory
        fields = ["id", "name", "slug", "parent", "parent_name"]
