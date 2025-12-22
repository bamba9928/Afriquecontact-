from rest_framework import serializers
from .models import Annonce
from catalog.serializers import JobCategorySerializer

class AnnonceSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour les annonces d'emploi.
    """
    categorie_details = JobCategorySerializer(source="categorie", read_only=True)
    auteur_phone = serializers.CharField(source="auteur.phone", read_only=True)

    class Meta:
        model = Annonce
        fields = [
            "id", "type", "titre", "description", "adresse",
            "telephone", "categorie", "categorie_details",
            "auteur_phone", "est_approuvee", "slug", "cree_le"
        ]
        read_only_fields = ["id", "est_approuvee", "slug", "cree_le"]