from rest_framework import serializers
from .models import Publicite

class PubliciteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publicite
        fields = [
            "id",
            "titre",
            "type_media",
            "fichier",
            "lien_redirection",
            "telephone_appel",
            "telephone_whatsapp",
            "priorite"
        ]