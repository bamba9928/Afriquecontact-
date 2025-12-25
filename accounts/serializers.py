from __future__ import annotations

import random

from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, WhatsAppOTP
from catalog.models import Job, Location
from pros.models import ProfilProfessionnel


class RegisterSerializer(serializers.Serializer):
    """
    Gère l'inscription atomique : Création User + Profil Pro + Envoi OTP.
    """
    phone = serializers.CharField(max_length=32)
    password = serializers.CharField(write_only=True, min_length=8)

    # Données du profil pro
    nom_entreprise = serializers.CharField(max_length=160)
    metier_id = serializers.IntegerField()
    zone_id = serializers.IntegerField()

    telephone_appel = serializers.CharField(max_length=32)
    telephone_whatsapp = serializers.CharField(max_length=32)

    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)

    def validate(self, attrs):
        # Normalisation du téléphone via le manager
        phone = User.objects.normalize_phone(attrs["phone"])
        attrs["phone"] = phone

        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError({"phone": "Ce numéro est déjà inscrit."})

        # Validation des clés étrangères
        try:
            attrs["metier"] = Job.objects.get(pk=attrs["metier_id"])
        except Job.DoesNotExist:
            raise serializers.ValidationError({"metier_id": "Métier introuvable."})

        try:
            attrs["zone"] = Location.objects.get(pk=attrs["zone_id"])
        except Location.DoesNotExist:
            raise serializers.ValidationError({"zone_id": "Zone géographique introuvable."})

        return attrs

    def create(self, validated_data):
        # 1. Création de l'utilisateur
        user = User.objects.create_user(
            phone=validated_data["phone"],
            password=validated_data["password"],
            role=User.Role.PRO
        )

        # 2. Création du profil pro lié (Champs mappés sur pros.models)
        ProfilProfessionnel.objects.create(
            utilisateur=user,
            nom_entreprise=validated_data["nom_entreprise"],
            metier=validated_data["metier"],
            zone_geographique=validated_data["zone"],
            telephone_appel=validated_data["telephone_appel"],
            telephone_whatsapp=validated_data["telephone_whatsapp"],
            latitude=validated_data.get("latitude"),
            longitude=validated_data.get("longitude"),
            est_publie=False,
        )

        # 3. Génération et Envoi du code OTP
        code = str(random.randint(100000, 999999)) if not settings.DEBUG else "123456"
        WhatsAppOTP.create_otp(phone=user.phone, code=code)

        # Ici : Appel au service d'envoi WhatsApp réel (ex: services.send_otp)

        return user


class VerifyWhatsappSerializer(serializers.Serializer):
    """
    Valide le code et retourne les tokens JWT (Access & Refresh).
    """
    phone = serializers.CharField(max_length=32)
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        phone = User.objects.normalize_phone(attrs["phone"])
        otp = WhatsAppOTP.objects.filter(phone=phone).order_by("-created_at").first()

        if not otp or otp.is_expired():
            raise serializers.ValidationError({"code": "Code expiré ou inexistant."})

        if otp.is_locked():
            raise serializers.ValidationError({"code": "Trop de tentatives. Réessayez plus tard."})

        if not otp.check_code(attrs["code"]):
            raise serializers.ValidationError({"code": "Code incorrect."})

        try:
            attrs["user"] = User.objects.get(phone=phone)
            attrs["otp"] = otp
        except User.DoesNotExist:
            raise serializers.ValidationError({"phone": "Utilisateur introuvable."})

        return attrs

    def save(self):
        user = self.validated_data["user"]
        otp = self.validated_data["otp"]

        # Validation du compte
        user.whatsapp_verified = True
        user.save(update_fields=["whatsapp_verified"])

        # On supprime l'OTP utilisé
        otp.delete()

        # Génération des tokens pour connexion automatique après vérification
        refresh = RefreshToken.for_user(user)
        return {
            "user_id": user.id,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class ResendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32)

    def validate_phone(self, value):
        phone = User.objects.normalize_phone(value)
        if not User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError("Numéro inconnu.")
        return phone


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "phone", "email", "role", "whatsapp_verified", "date_joined"]
        read_only_fields = ["phone", "role", "whatsapp_verified", "date_joined"]
# Ajoutez ce serializer pour les clients simples
class RegisterClientSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32)
    password = serializers.CharField(write_only=True, min_length=8)
    # Optionnel: Nom/Prénom si besoin

    def validate_phone(self, value):
        phone = User.objects.normalize_phone(value)
        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError("Ce numéro est déjà inscrit.")
        return phone

    def create(self, validated_data):
        user = User.objects.create_user(
            phone=validated_data["phone"],
            password=validated_data["password"],
            role=User.Role.CLIENT
        )
        # Génération OTP identique au Pro
        code = str(random.randint(100000, 999999)) if not settings.DEBUG else "123456"
        WhatsAppOTP.create_otp(phone=user.phone, code=code)
        return user