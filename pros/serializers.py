from rest_framework import serializers
from pros.models import ProfilProfessionnel


class ProMeSerializer(serializers.ModelSerializer):
    """
    Serializer complet utilisé par le professionnel pour gérer son propre profil.
    """
    telephone_utilisateur = serializers.CharField(source="utilisateur.phone", read_only=True)
    whatsapp_verifie = serializers.BooleanField(source="utilisateur.whatsapp_verified", read_only=True)

    class Meta:
        model = ProfilProfessionnel
        fields = [
            "id",
            "telephone_utilisateur",
            "whatsapp_verifie",
            "nom_entreprise",
            "metier",
            "zone_geographique",
            "description",
            "telephone_appel",
            "telephone_whatsapp",
            "avatar",
            "statut_en_ligne",
            "est_publie",
            "latitude",
            "longitude",
            "cree_le",
            "mis_a_jour_le",
        ]
        read_only_fields = ["id", "cree_le", "mis_a_jour_le", "est_publie"]


class ProPublicSerializer(serializers.ModelSerializer):
    """
    Serializer allégé pour l'affichage public dans les résultats de recherche.
    """
    class Meta:
        model = ProfilProfessionnel
        fields = [
            "id",
            "nom_entreprise",
            "metier",
            "zone_geographique",
            "description",
            "telephone_appel",
            "telephone_whatsapp",
            "avatar",
            "statut_en_ligne",
            "latitude",
            "longitude",
        ]