from __future__ import annotations

from rest_framework import serializers
from catalog.models import JobCategory, Location
from catalog.serializers import JobCategorySerializer, LocationSerializer
from annonces.models import Annonce, PHONE_VALIDATOR


class AnnonceListSerializer(serializers.ModelSerializer):
    auteur_display = serializers.SerializerMethodField()
    categorie = JobCategorySerializer(read_only=True)
    zone_geographique = LocationSerializer(read_only=True)

    class Meta:
        model = Annonce
        fields = [
            "id",
            "type",
            "titre",
            "slug",
            "categorie",
            "zone_geographique",
            "adresse_precise",
            "nb_vues",
            "est_approuvee",
            "statut",
            "cree_le",
            "auteur_display",
        ]

    def get_auteur_display(self, obj):
        return str(obj.auteur)


class AnnonceDetailSerializer(serializers.ModelSerializer):
    auteur_display = serializers.SerializerMethodField()
    categorie = JobCategorySerializer(read_only=True)
    zone_geographique = LocationSerializer(read_only=True)

    class Meta:
        model = Annonce
        fields = [
            "id",
            "type",
            "titre",
            "slug",
            "description",
            "categorie",
            "zone_geographique",
            "adresse_precise",
            "telephone",
            "nb_vues",
            "est_approuvee",
            "statut",
            "motif_rejet",
            "cree_le",
            "mis_a_jour_le",
            "auteur_display",
        ]

    def get_auteur_display(self, obj):
        return str(obj.auteur)


class AnnonceWriteSerializer(serializers.ModelSerializer):
    # Support id ou slug pour categorie / zone
    categorie_slug = serializers.SlugField(write_only=True, required=False)
    zone_slug = serializers.SlugField(write_only=True, required=False)

    class Meta:
        model = Annonce
        fields = [
            "type",
            "titre",
            "description",
            "categorie",
            "categorie_slug",
            "zone_geographique",
            "zone_slug",
            "adresse_precise",
            "telephone",
            "statut",
        ]
        extra_kwargs = {
            "categorie": {"required": False},
            "zone_geographique": {"required": False},
        }

    def validate_telephone(self, value: str):
        value = (value or "").replace(" ", "").strip()
        PHONE_VALIDATOR(value)
        return value

    def validate(self, attrs):
        # categorie via slug si besoin
        if not attrs.get("categorie") and attrs.get("categorie_slug"):
            try:
                attrs["categorie"] = JobCategory.objects.get(slug=attrs["categorie_slug"])
            except JobCategory.DoesNotExist:
                raise serializers.ValidationError({"categorie_slug": "Catégorie introuvable"})

        if not attrs.get("zone_geographique") and attrs.get("zone_slug"):
            try:
                attrs["zone_geographique"] = Location.objects.get(slug=attrs["zone_slug"])
            except Location.DoesNotExist:
                raise serializers.ValidationError({"zone_slug": "Zone introuvable"})

        # Nettoyage
        attrs.pop("categorie_slug", None)
        attrs.pop("zone_slug", None)
        return attrs


class AnnonceModerationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject", "archive"])
    motif_rejet = serializers.CharField(required=False, allow_blank=True)


class AnnonceSerializer(serializers.ModelSerializer):
    """
    Serializer complet (create/update + admin + mes annonces)
    - input: categorie / zone_geographique en IDs
    - output: categorie / zone_geographique en objets (via to_representation)
    """
    category_name = serializers.CharField(source="categorie.name", read_only=True)
    zone_name = serializers.CharField(source="zone_geographique.name", read_only=True)

    class Meta:
        model = Annonce
        fields = [
            "id",
            "type",
            "titre",
            "slug",
            "description",
            "categorie",
            "category_name",
            "zone_geographique",
            "zone_name",
            "adresse_precise",
            "telephone",
            "est_approuvee",
            "nb_vues",
            "cree_le",
            "mis_a_jour_le",
        ]
        read_only_fields = ["id", "slug", "nb_vues", "cree_le", "mis_a_jour_le"]

    def validate_telephone(self, value: str):
        value = (value or "").replace(" ", "").strip()
        PHONE_VALIDATOR(value)
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Remplace les IDs par objets (sans casser l’écriture par ID)
        if instance.categorie_id:
            data["categorie"] = JobCategorySerializer(instance.categorie).data
        if instance.zone_geographique_id:
            data["zone_geographique"] = LocationSerializer(instance.zone_geographique).data

        # auteur utile côté mobile (si tu veux)
        data["auteur_display"] = str(instance.auteur)
        return data


class AnnoncePublicSerializer(AnnonceSerializer):
    """
    Serializer public (par défaut identique).
    Si tu veux masquer le téléphone publiquement, enlève "telephone" des fields ici.
    """
    class Meta(AnnonceSerializer.Meta):
        fields = AnnonceSerializer.Meta.fields
