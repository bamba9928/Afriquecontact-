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
    Serializer simple (plat) pour les localisations.
    """
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Location
        fields = ["id", "name", "type", "type_display", "slug", "parent"]


class LocationTreeSerializer(serializers.ModelSerializer):
    """
    Serializer récursif pour l'arbre des localisations.
    Utilise 'children_filtered' injecté par la View pour respecter la hiérarchie complète.
    """
    children = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ["id", "name", "slug", "type", "children"]

    def get_children(self, obj):
        # 1. Priorité : Utiliser les enfants pré-filtrés/pré-chargés par la View
        # (C'est ce qui permet de récupérer Dept -> City -> District)
        children = getattr(obj, "children_filtered", None)

        # 2. Fallback : Si pas de pré-chargement, requête DB standard
        if children is None:
            children = obj.children.all().order_by('name')

        return LocationTreeSerializer(children, many=True).data