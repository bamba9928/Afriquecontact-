# pros/serializers.py

from __future__ import annotations

import os
import mimetypes
from typing import Optional

from django.db import transaction
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
            "max_size": 5 * 1024 * 1024,  # 5 Mo
            "extensions": {".jpg", ".jpeg", ".png", ".webp"},
            "content_types": {"image/jpeg", "image/png", "image/webp"},
        },
        "VIDEO": {
            "max_size": 50 * 1024 * 1024,  # 50 Mo
            "extensions": {".mp4", ".mov", ".avi", ".mkv"},
            "content_types": {
                "video/mp4",
                "video/quicktime",
                "video/x-msvideo",
                "video/x-matroska",
            },
        },
        "CV": {
            "max_size": 3 * 1024 * 1024,  # 3 Mo
            "extensions": {".pdf"},
            "content_types": {"application/pdf"},
        },
    }

    class Meta:
        model = MediaPro
        fields = ["id", "type_media", "fichier", "est_principal", "cree_le"]
        read_only_fields = ["id", "cree_le"]

    def validate_type_media(self, value: str) -> str:
        value = str(value).upper()
        if value not in self.MEDIA_RULES:
            raise serializers.ValidationError(f"Type de média '{value}' non supporté.")
        return value

    def validate(self, attrs):
        """
        Option recommandée : est_principal uniquement pour les photos (image de couverture).
        """
        type_media = (attrs.get("type_media") or getattr(self.instance, "type_media", None) or "").upper()
        est_principal = attrs.get("est_principal", getattr(self.instance, "est_principal", False))

        if est_principal and type_media and type_media != "PHOTO":
            raise serializers.ValidationError({"est_principal": "Le média principal doit être une PHOTO."})
        return attrs

    def validate_fichier(self, value):
        raw_type = (
            self.initial_data.get("type_media")
            or (getattr(self.instance, "type_media", None) if self.instance else None)
        )
        if not raw_type:
            raise serializers.ValidationError("Le champ 'type_media' est requis.")

        media_type = str(raw_type).upper()
        rules = self.MEDIA_RULES.get(media_type)
        if not rules:
            raise serializers.ValidationError(f"Type de média '{raw_type}' non supporté.")

        # Taille
        size = getattr(value, "size", None)
        if size is not None and size > rules["max_size"]:
            max_mb = rules["max_size"] / (1024 * 1024)
            raise serializers.ValidationError(f"Fichier trop volumineux (max {max_mb:.0f} Mo).")

        # Extension
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in rules["extensions"]:
            raise serializers.ValidationError(f"Extension {ext} non autorisée.")

        # MIME (si dispo, sinon guess par extension)
        content_type = getattr(value, "content_type", None)
        if not content_type:
            guessed, _ = mimetypes.guess_type(value.name)
            content_type = guessed

        if content_type and content_type not in rules["content_types"]:
            raise serializers.ValidationError(
                f"Type de fichier '{content_type}' non autorisé pour {media_type}."
            )

        return value

    def _get_pro_from_save_kwargs(self, validated_data):
        """
        Supporte:
        - serializer.save(professionnel=...) (perform_create)
        - champ professionnel dans validated_data
        """
        pro = validated_data.get("professionnel")
        if pro:
            return pro

        req = self.context.get("request")
        if req and getattr(req.user, "is_authenticated", False) and hasattr(req.user, "pro_profile"):
            return req.user.pro_profile

        return None

    @transaction.atomic
    def create(self, validated_data):
        pro = self._get_pro_from_save_kwargs(validated_data)

        if pro and validated_data.get("est_principal") is True:
            MediaPro.objects.filter(professionnel=pro, est_principal=True).update(est_principal=False)

        if pro and "professionnel" not in validated_data:
            validated_data["professionnel"] = pro

        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        if validated_data.get("est_principal") is True:
            MediaPro.objects.filter(
                professionnel=instance.professionnel,
                est_principal=True,
            ).exclude(pk=instance.pk).update(est_principal=False)

        return super().update(instance, validated_data)


class ProMeSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour la gestion du profil par le professionnel.
    """
    telephone_utilisateur = serializers.CharField(source="utilisateur.phone", read_only=True)
    whatsapp_verifie = serializers.BooleanField(source="utilisateur.whatsapp_verified", read_only=True)

    metier_details = JobSerializer(source="metier", read_only=True)
    zone_details = LocationSerializer(source="zone_geographique", read_only=True)
    intervention_details = LocationSerializer(source="zones_intervention", many=True, read_only=True)

    class Meta:
        model = ProfilProfessionnel
        fields = [
            "id",
            "telephone_utilisateur",
            "whatsapp_verifie",
            "nom_entreprise",
            "metier",
            "metier_details",
            "zone_geographique",
            "zone_details",
            "zones_intervention",
            "intervention_details",
            "description",
            "telephone_appel",
            "telephone_whatsapp",
            "avatar",
            "statut_en_ligne",
            "est_publie",
            "latitude",
            "longitude",
            "note_moyenne",
            "nombre_avis",
            "cree_le",
            "mis_a_jour_le",
        ]
        read_only_fields = ["id", "cree_le", "mis_a_jour_le", "est_publie", "note_moyenne", "nombre_avis"]


class ProPublicSerializer(serializers.ModelSerializer):
    """
    Public: téléphones masqués si abonnement inactif + is_contactable.
    """
    telephone_appel = serializers.SerializerMethodField()
    telephone_whatsapp = serializers.SerializerMethodField()
    is_contactable = serializers.SerializerMethodField()

    metier_name = serializers.CharField(source="metier.name", read_only=True)
    zone_name = serializers.CharField(source="zone_geographique.name", read_only=True)

    photo_couverture = serializers.SerializerMethodField()

    class Meta:
        model = ProfilProfessionnel
        fields = [
            "id",
            "slug",
            "nom_entreprise",
            "metier_name",
            "zone_name",
            "description",
            "telephone_appel",
            "telephone_whatsapp",
            "is_contactable",
            "avatar",
            "photo_couverture",
            "statut_en_ligne",
            "latitude",
            "longitude",
            "note_moyenne",
        ]

    def _has_active_subscription(self, obj) -> bool:
        annotated = getattr(obj, "has_active_subscription", None)
        if annotated is not None:
            return bool(annotated)

        if hasattr(obj, "active_sub"):
            val = getattr(obj, "active_sub")
            try:
                return bool(len(val))
            except TypeError:
                return bool(val)

        # fallback (éviter si liste -> N+1)
        return Subscription.objects.filter(
            user=obj.utilisateur,
            status=Subscription.Status.ACTIVE,
        ).exists()

    def get_is_contactable(self, obj) -> bool:
        return self._has_active_subscription(obj)

    def get_telephone_appel(self, obj) -> Optional[str]:
        return obj.telephone_appel if self._has_active_subscription(obj) else None

    def get_telephone_whatsapp(self, obj) -> Optional[str]:
        return obj.telephone_whatsapp if self._has_active_subscription(obj) else None

    def get_photo_couverture(self, obj) -> Optional[str]:
        pre = getattr(obj, "photo_couverture_url", None)
        if pre is not None:
            return pre

        # IMPORTANT: .filter() ignore le cache prefetch -> risque N+1.
        # On utilise .all() pour exploiter le prefetch côté listing.
        try:
            medias = obj.media.all()
        except Exception:
            return None

        principal = None
        for m in medias:
            if m.type_media == "PHOTO" and m.est_principal:
                principal = m
                break

        if not principal:
            return None

        try:
            return principal.fichier.url if principal.fichier else None
        except Exception:
            return None


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
        req = self.context.get("request")
        user = getattr(req, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return attrs

        pro = attrs.get("professionnel") or getattr(self.instance, "professionnel", None)
        if pro and ContactFavori.objects.filter(proprietaire=user, professionnel=pro).exists():
            raise serializers.ValidationError("Ce professionnel est déjà dans vos favoris.")
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        return ContactFavori.objects.create(proprietaire=user, **validated_data)
