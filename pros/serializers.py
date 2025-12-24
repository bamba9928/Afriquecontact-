import os
import mimetypes
from rest_framework import serializers
from billing.models import Subscription
from pros.models import ProfilProfessionnel, ContactFavori, MediaPro
from catalog.serializers import JobSerializer, LocationSerializer

class MediaProSerializer(serializers.ModelSerializer):
    """
    Serializer pour gérer les photos, vidéos et CV dans la galerie du pro.
    """
    MEDIA_RULES = {
        "PHOTO": {
            "max_size": 5 * 1024 * 1024,
            "extensions": {".jpg", ".jpeg", ".png", ".webp"},
            "content_types": {"image/jpeg", "image/png", "image/webp"},
        },
        "VIDEO": {
            "max_size": 50 * 1024 * 1024,
            "extensions": {".mp4", ".mov", ".avi", ".mkv"},
            "content_types": {"video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska"},
        },
        "CV": {
            "max_size": 3 * 1024 * 1024,
            "extensions": {".pdf"},
            "content_types": {"application/pdf"},
        },
    }

    class Meta:
        model = MediaPro
        fields = ["id", "type_media", "fichier", "est_principal", "cree_le"]
        read_only_fields = ["id", "cree_le"]

    def validate_fichier(self, value):
        raw_type = self.initial_data.get("type_media") or (self.instance.type_media if self.instance else None)
        if not raw_type:
            raise serializers.ValidationError("Le champ 'type_media' est requis.")

        media_type = str(raw_type).upper()
        rules = self.MEDIA_RULES.get(media_type)
        if not rules:
            raise serializers.ValidationError(f"Type de média '{raw_type}' non supporté.")

        # Validation Taille
        if value.size > rules["max_size"]:
            raise serializers.ValidationError(f"Fichier trop volumineux (max {rules['max_size']/(1024*1024)} Mo).")

        # Validation Extension et MIME
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in rules["extensions"]:
            raise serializers.ValidationError(f"Extension {ext} non autorisée.")

        return value

class ProMeSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour la gestion du profil par le professionnel.
    """
    telephone_utilisateur = serializers.CharField(source="utilisateur.phone", read_only=True)
    whatsapp_verifie = serializers.BooleanField(source="utilisateur.whatsapp_verified", read_only=True)
    # Utilise les serializers de catalog pour plus de détails
    metier_details = JobSerializer(source="metier", read_only=True)
    zone_details = LocationSerializer(source="zone_geographique", read_only=True)
    intervention_details = LocationSerializer(source="zones_intervention", many=True, read_only=True)

    class Meta:
        model = ProfilProfessionnel
        fields = [
            "id", "telephone_utilisateur", "whatsapp_verifie", "nom_entreprise",
            "metier", "metier_details", "zone_geographique", "zone_details",
            "zones_intervention", "intervention_details", "description",
            "telephone_appel", "telephone_whatsapp", "avatar", "statut_en_ligne",
            "est_publie", "latitude", "longitude", "note_moyenne", "nombre_avis",
            "cree_le", "mis_a_jour_le",
        ]
        read_only_fields = ["id", "cree_le", "mis_a_jour_le", "est_publie", "note_moyenne", "nombre_avis"]

class ProPublicSerializer(serializers.ModelSerializer):
    """
    Serializer public optimisé pour la recherche et l'affichage client.
    """
    telephone_appel = serializers.SerializerMethodField()
    telephone_whatsapp = serializers.SerializerMethodField()
    metier_name = serializers.CharField(source="metier.name", read_only=True)
    zone_name = serializers.CharField(source="zone_geographique.name", read_only=True)
    # Récupère l'image de couverture
    photo_couverture = serializers.SerializerMethodField()

    class Meta:
        model = ProfilProfessionnel
        fields = [
            "id", "nom_entreprise", "metier_name", "zone_name", "description",
            "telephone_appel", "telephone_whatsapp", "avatar", "photo_couverture",
            "statut_en_ligne", "latitude", "longitude", "note_moyenne",
        ]

    def get_photo_couverture(self, obj):
        main_media = obj.media.filter(type_media="PHOTO", est_principal=True).first()
        return main_media.fichier.url if main_media else None

    def _has_active_subscription(self, obj):
        # Optimisation : On vérifie si l'abonnement a été pré-chargé dans la vue
        if hasattr(obj, 'active_sub'):
            return len(obj.active_sub) > 0
        # Fallback classique
        return Subscription.objects.filter(user=obj.utilisateur, status="ACTIVE").exists()

    def get_telephone_appel(self, obj):
        if self._has_active_subscription(obj):
            return obj.telephone_appel
        return "Numéro masqué (Abonnement requis)"

    def get_telephone_whatsapp(self, obj):
        if self._has_active_subscription(obj):
            return obj.telephone_whatsapp
        return "Numéro masqué"


class ContactFavoriSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'onglet 'Mes Contacts'.
    """
    professionnel_details = ProPublicSerializer(source="professionnel", read_only=True)

    class Meta:
        model = ContactFavori
        fields = ["id", "professionnel", "professionnel_details", "cree_le"]
        read_only_fields = ["id", "cree_le", "professionnel_details"]

    def validate(self, attrs):
        user = self.context["request"].user
        if ContactFavori.objects.filter(proprietaire=user, professionnel=attrs["professionnel"]).exists():
            raise serializers.ValidationError("Ce professionnel est déjà dans vos favoris.")
        return attrs