from rest_framework import serializers
from catalog.models import Job, JobCategory, Location


class JobCategorySerializer(serializers.ModelSerializer):
    """
    Serializer gérant la hiérarchie des catégories (sous-catégories).
    """
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = JobCategory
        fields = ["id", "name", "slug", "parent", "subcategories"]

    def get_subcategories(self, obj):
        # Récupère récursivement les enfants si la catégorie est un parent
        if obj.subcategories.exists():
            return JobCategorySerializer(obj.subcategories.all(), many=True).data
        return []


class JobSerializer(serializers.ModelSerializer):
    """
    Serializer pour les métiers avec le détail de leur catégorie rattachée.
    """
    category_name = serializers.CharField(source="category.name", read_only=True)
    full_category_path = serializers.StringRelatedField(source="category", read_only=True)

    class Meta:
        model = Job
        fields = ["id", "name", "slug", "is_featured", "category", "category_name", "full_category_path"]


class LocationSerializer(serializers.ModelSerializer):
    """
    Serializer simple pour les localisations.
    """
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Location
        fields = ["id", "name", "type", "type_display", "slug", "parent"]
class JobCategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = JobCategory
        fields = ["id", "name", "slug", "parent", "subcategories"]

    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return JobCategorySerializer(obj.subcategories.all(), many=True).data
        return []


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

class LocationTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ["id", "name", "slug", "type", "children"]

    def get_children(self, obj):
        children = getattr(obj, "children_filtered", None)
        if children is None:
            # fallback si pas de prefetch
            children = obj.children.all()
        return LocationTreeSerializer(children, many=True).data
