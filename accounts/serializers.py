from __future__ import annotations

import secrets
from django.conf import settings
from django.db import transaction

from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, WhatsAppOTP
from catalog.models import Job, Location
from pros.models import ProfilProfessionnel


def generate_otp_code() -> str:
    """Génère un code à 6 chiffres."""
    if settings.DEBUG:
        return "123456"
    return f"{secrets.randbelow(1_000_000):06d}"


class RegisterSerializer(serializers.Serializer):
    """
    Inscription atomique : User + Profil Pro + OTP
    """
    phone = serializers.CharField(max_length=32)
    password = serializers.CharField(write_only=True, min_length=8)

    nom_entreprise = serializers.CharField(max_length=160)
    metier_id = serializers.IntegerField()
    zone_id = serializers.IntegerField()

    telephone_appel = serializers.CharField(max_length=32)
    telephone_whatsapp = serializers.CharField(max_length=32)

    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)

    def validate(self, attrs):
        # Normalisation des numéros
        phone = User.objects.normalize_phone(attrs["phone"])
        attrs["phone"] = phone
        attrs["telephone_appel"] = User.objects.normalize_phone(attrs["telephone_appel"])
        attrs["telephone_whatsapp"] = User.objects.normalize_phone(attrs["telephone_whatsapp"])

        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError({"phone": "Ce numéro est déjà inscrit."})

        # Validation existence Métier / Zone
        try:
            attrs["metier"] = Job.objects.get(pk=attrs["metier_id"])
        except Job.DoesNotExist:
            raise serializers.ValidationError({"metier_id": "Métier introuvable."})

        try:
            attrs["zone"] = Location.objects.get(pk=attrs["zone_id"])
        except Location.DoesNotExist:
            raise serializers.ValidationError({"zone_id": "Zone géographique introuvable."})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        # 1. Création User
        user = User.objects.create_user(
            phone=validated_data["phone"],
            password=validated_data["password"],
            role=User.Role.PRO,
        )

        # 2. Création Profil Pro
        ProfilProfessionnel.objects.create(
            utilisateur=user,
            nom_entreprise=validated_data["nom_entreprise"],
            metier=validated_data["metier"],
            zone_geographique=validated_data["zone"],
            telephone_appel=validated_data["telephone_appel"],
            telephone_whatsapp=validated_data["telephone_whatsapp"],
            latitude=validated_data.get("latitude"),
            longitude=validated_data.get("longitude"),
            # Par défaut False tant que l'abonnement n'est pas payé
            est_publie=False,
        )

        # 3. Génération OTP
        code = generate_otp_code()
        WhatsAppOTP.create_otp(phone=user.phone, code=code)

        # TODO: Appeler ici votre task Celery ou service pour envoyer le SMS WhatsApp
        # send_whatsapp_otp.delay(user.phone, code)

        return user


class VerifyWhatsappSerializer(serializers.Serializer):
    """
    Vérifie le code WhatsApp et retourne les tokens JWT.
    """
    phone = serializers.CharField(max_length=32)
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        phone = User.objects.normalize_phone(attrs["phone"])

        # On récupère le dernier OTP
        otp = WhatsAppOTP.objects.filter(phone=phone).order_by("-created_at").first()

        if not otp:
            raise serializers.ValidationError({"code": "Aucun code en attente pour ce numéro."})

        if otp.is_expired():
            raise serializers.ValidationError({"code": "Code expiré."})

        if otp.is_locked():
            raise serializers.ValidationError({"code": "Trop de tentatives. Réessayez dans 15 min."})

        # check_code() dans le modèle supprime l'objet si valide !
        if not otp.check_code(attrs["code"]):
            raise serializers.ValidationError({"code": "Code incorrect."})

        try:
            attrs["user"] = User.objects.get(phone=phone)
        except User.DoesNotExist:
            raise serializers.ValidationError({"phone": "Utilisateur introuvable."})

        return attrs

    def save(self):
        user = self.validated_data["user"]

        # Mise à jour du statut
        if not user.whatsapp_verified:
            user.whatsapp_verified = True
            user.save(update_fields=["whatsapp_verified"])

        # Génération des tokens JWT
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": user.role,  # Utile pour le front-end
        }


class ResendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32)

    def validate_phone(self, value):
        phone = User.objects.normalize_phone(value)
        if not User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError("Numéro inconnu.")
        return phone

    def create(self, validated_data):
        code = generate_otp_code()
        # create_otp gère l'update si existe déjà
        return WhatsAppOTP.create_otp(phone=validated_data["phone"], code=code)


class MeSerializer(serializers.ModelSerializer):
    """
    Renvoie les infos de l'utilisateur courant.
    """

    class Meta:
        model = User
        fields = ["id", "phone", "email", "role", "whatsapp_verified", "date_joined"]
        read_only_fields = ["phone", "role", "whatsapp_verified", "date_joined"]