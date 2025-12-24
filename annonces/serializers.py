from __future__ import annotations
from rest_framework import serializers
from .models import Annonce
from catalog.serializers import JobCategorySerializer, LocationSerializer


class AnnonceSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour les annonces (Offres et Demandes).
    Gère l'affichage des détails (catégories, lieux) et la validation.
    """
    # Détails imbriqués pour l'affichage (Lecture seule)
    categorie_details = JobCategorySerializer(source="categorie", read_only=True)
    zone_details = LocationSerializer(source="zone_geographique", read_only=True)

    # Informations de l'auteur
    auteur_phone = serializers.CharField(source="auteur.phone", read_only=True)
    est_mon_annonce = serializers.SerializerMethodField()

    class Meta:
        model = Annonce
        fields = [
            "id",
            "type",
            "titre",
            "slug",
            "description",
            "zone_geographique",
            "zone_details",
            "adresse_precise",
            "telephone",
            "categorie",
            "categorie_details",
            "auteur_phone",
            "est_mon_annonce",
            "est_approuvee",
            "nb_vues",
            "cree_le"
        ]
        read_only_fields = [
            "id",
            "slug",
            "est_approuvee",
            "nb_vues",
            "cree_le"
        ]

    def get_est_mon_annonce(self, obj) -> bool:
        """Permet au mobile d'afficher les boutons 'Modifier/Supprimer'."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.auteur_id == request.user.id
        return False

    def validate_telephone(self, value):
        """Nettoyage final du téléphone avant enregistrement."""
        return value.replace(" ", "").strip()