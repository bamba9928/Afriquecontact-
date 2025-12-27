from rest_framework import serializers
from .models import Publicite

class PubliciteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publicite
        fields = [
            "id", "titre", "fichier", "lien_redirection",
            "telephone_appel", "telephone_whatsapp",
            "date_debut", "date_fin", "est_active"
        ]