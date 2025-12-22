import os
import mimetypes
from rest_framework import serializers
from billing.models import Subscription
from pros.models import ProfilProfessionnel, ContactFavori, MediaPro


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
    telephone_appel = serializers.SerializerMethodField()
    telephone_whatsapp = serializers.SerializerMethodField()

    class Meta:
        model = ProfilProfessionnel
        fields = [
            "id", "nom_entreprise", "metier", "zone_geographique",
            "description", "telephone_appel", "telephone_whatsapp",
            "avatar", "statut_en_ligne", "latitude", "longitude",
        ]

    def get_telephone_appel(self, obj):
        # On vérifie si le pro a un abonnement actif
        sub = Subscription.objects.filter(user=obj.utilisateur, status="ACTIVE").first()
        if sub and sub.is_active():
            return obj.telephone_appel
        return "Numéro masqué (Abonnement requis)"

    def get_telephone_whatsapp(self, obj):
        sub = Subscription.objects.filter(user=obj.utilisateur, status="ACTIVE").first()
        if sub and sub.is_active():
            return obj.telephone_whatsapp
        return "Numéro masqué"
class MediaProSerializer(serializers.ModelSerializer):
    """
    Serializer pour gérer les photos, vidéos et CV dans la galerie du pro.
    """

    # Règles par type_media (adapte les clés à tes choix : "PHOTO"/"VIDEO"/"CV", etc.)
    MEDIA_RULES = {
        "PHOTO": {
            "max_size": 5 * 1024 * 1024,  # 5 Mo
            "extensions": {".jpg", ".jpeg", ".png", ".webp"},
            "content_types": {"image/jpeg", "image/png", "image/webp"},
        },
        "VIDEO": {
            "max_size": 50 * 1024 * 1024,  # 50 Mo
            "extensions": {".mp4", ".mov", ".avi", ".mkv"},
            "content_types": {"video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska"},
        },
        "CV": {
            "max_size": 3 * 1024 * 1024,  # 3 Mo
            "extensions": {".pdf"},
            "content_types": {"application/pdf"},
        },
    }

    class Meta:
        model = MediaPro
        fields = ["id", "type_media", "fichier", "cree_le"]
        read_only_fields = ["id", "cree_le"]

    def validate_fichier(self, value):
        # Récupère type_media depuis l'input (create) ou l'instance (update)
        raw_type = None
        if hasattr(self, "initial_data"):
            raw_type = self.initial_data.get("type_media")
        if raw_type is None and getattr(self, "instance", None) is not None:
            raw_type = getattr(self.instance, "type_media", None)

        if raw_type is None:
            raise serializers.ValidationError("Le champ 'type_media' est requis pour valider le fichier.")

        media_type = str(raw_type).upper()
        rules = self.MEDIA_RULES.get(media_type)
        if not rules:
            raise serializers.ValidationError(
                f"type_media='{raw_type}' n'est pas supporté. Valeurs attendues: {', '.join(self.MEDIA_RULES.keys())}."
            )

        # 1) Taille
        size = getattr(value, "size", None)
        if size is not None and size > rules["max_size"]:
            max_mb = rules["max_size"] / (1024 * 1024)
            raise serializers.ValidationError(f"Fichier trop volumineux (max {max_mb:.0f} Mo).")

        # 2) Extension
        name = getattr(value, "name", "") or ""
        ext = os.path.splitext(name)[1].lower()
        if ext not in rules["extensions"]:
            allowed = ", ".join(sorted(rules["extensions"]))
            raise serializers.ValidationError(f"Extension non autorisée ({ext}). Extensions permises: {allowed}.")

        # 3) MIME / content-type (si disponible)
        content_type = getattr(value, "content_type", None)
        if not content_type:
            content_type, _ = mimetypes.guess_type(name)

        if content_type and content_type not in rules["content_types"]:
            allowed = ", ".join(sorted(rules["content_types"]))
            raise serializers.ValidationError(
                f"Type MIME non autorisé ({content_type}). Types permis: {allowed}."
            )

        # 4) Contrôle léger du header pour PDF (évite faux .pdf)
        if media_type == "CV":
            try:
                pos = value.file.tell()
            except Exception:
                pos = None

            try:
                head = value.file.read(5)
                if head != b"%PDF-":
                    raise serializers.ValidationError("Le CV doit être un PDF valide.")
            finally:
                # Remet le curseur au début (important pour l'enregistrement)
                try:
                    if pos is None:
                        value.file.seek(0)
                    else:
                        value.file.seek(pos)
                except Exception:
                    pass

        return value
class ContactFavoriSerializer(serializers.ModelSerializer):
    """
    Serializer pour la liste des contacts favoris d'un utilisateur.
    """
    # On imbrique le serializer public pour afficher les détails du pro favorisé
    professionnel_details = ProPublicSerializer(source="professionnel", read_only=True)

    class Meta:
        model = ContactFavori
        fields = ["id", "professionnel", "professionnel_details", "cree_le"]
        read_only_fields = ["id", "cree_le", "professionnel_details"]

    def validate(self, attrs):
        # Empêcher d'ajouter deux fois le même pro en favoris
        user = self.context["request"].user
        pro = attrs["professionnel"]
        if ContactFavori.objects.filter(proprietaire=user, professionnel=pro).exists():
            raise serializers.ValidationError("Ce professionnel est déjà dans vos favoris.")
        return attrs