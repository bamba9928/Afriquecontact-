from rest_framework import serializers
from .models import Publicite

class PubliciteSerializer(serializers.ModelSerializer):
    # Champ calculé pour faciliter le travail du Front-end
    est_visible = serializers.BooleanField(read_only=True)
    fichier_url = serializers.SerializerMethodField()

    class Meta:
        model = Publicite
        fields = [
            "id",
            "titre",
            "fichier",
            "fichier_url", # URL absolue pratique pour le mobile
            "lien_redirection",
            "telephone_appel",
            "telephone_whatsapp",
            "date_debut",
            "duree_jours", # Important pour savoir quelle durée a été choisie
            "date_fin",
            "est_active",
            "est_visible"
        ]
        read_only_fields = ["date_fin", "est_active", "cree_le"]

    def get_fichier_url(self, obj):
        request = self.context.get('request')
        if obj.fichier and request:
            return request.build_absolute_uri(obj.fichier.url)
        return None