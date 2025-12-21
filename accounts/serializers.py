from __future__ import annotations

from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, WhatsAppOTP
from catalog.models import Job, Location
from pros.models import ProfessionalProfile


class RegisterSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32)
    password = serializers.CharField(write_only=True, min_length=8)

    business_name = serializers.CharField(max_length=160)
    job_id = serializers.IntegerField()
    location_id = serializers.IntegerField()

    call_phone = serializers.CharField(max_length=32)
    whatsapp_phone = serializers.CharField(max_length=32)

    # optionnel (MVP lat/lng)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)

    def validate(self, attrs):
        phone = str(attrs["phone"]).strip().replace(" ", "")
        attrs["phone"] = phone

        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError({"phone": "Ce téléphone est déjà utilisé."})

        try:
            attrs["job"] = Job.objects.get(pk=attrs["job_id"])
        except Job.DoesNotExist:
            raise serializers.ValidationError({"job_id": "Métier invalide."})

        try:
            attrs["location"] = Location.objects.get(pk=attrs["location_id"])
        except Location.DoesNotExist:
            raise serializers.ValidationError({"location_id": "Localisation invalide."})

        return attrs

    def create(self, validated_data):
        phone = validated_data["phone"]
        password = validated_data["password"]

        user = User.objects.create_user(
            phone=phone,
            password=password,
            role=User.Role.PRO,
            whatsapp_verified=False,
        )

        ProfessionalProfile.objects.create(
            user=user,
            business_name=validated_data["business_name"],
            job=validated_data["job"],
            location=validated_data["location"],
            call_phone=validated_data["call_phone"],
            whatsapp_phone=validated_data["whatsapp_phone"],
            latitude=validated_data.get("latitude"),
            longitude=validated_data.get("longitude"),
            is_published=False,
        )

        # MVP: OTP mock (plus tard: intégration WhatsApp provider)
        code = "123456"
        WhatsAppOTP.create_otp(phone=phone, code=code, ttl_minutes=5)

        out = {"phone": phone, "detail": "OTP envoyé sur WhatsApp (MVP)."}
        if settings.DEBUG:
            out["otp_debug"] = code
        return out


class VerifyWhatsappSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32)
    code = serializers.CharField(max_length=10)

    def validate(self, attrs):
        phone = str(attrs["phone"]).strip().replace(" ", "")
        code = str(attrs["code"]).strip()
        attrs["phone"] = phone
        attrs["code"] = code

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            raise serializers.ValidationError({"phone": "Utilisateur introuvable."})

        otp = (
            WhatsAppOTP.objects
            .filter(phone=phone)
            .order_by("-created_at")
            .first()
        )
        if not otp:
            raise serializers.ValidationError({"code": "Aucun OTP trouvé."})

        if otp.is_locked():
            raise serializers.ValidationError({"code": "Trop de tentatives. Réessayez plus tard."})

        if otp.is_expired():
            raise serializers.ValidationError({"code": "OTP expiré."})

        if otp.code != code:
            otp.attempts += 1
            if otp.attempts >= otp.max_attempts:
                from datetime import timedelta
                from django.utils import timezone
                otp.locked_until = timezone.now() + timedelta(minutes=15)
            otp.save(update_fields=["attempts", "locked_until"])
            raise serializers.ValidationError({"code": "OTP invalide."})

        attrs["user"] = user
        attrs["otp"] = otp
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        otp = validated_data["otp"]

        user.whatsapp_verified = True
        user.save(update_fields=["whatsapp_verified"])

        otp.delete()

        refresh = RefreshToken.for_user(user)
        return {
            "detail": "WhatsApp vérifié.",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "phone", "email", "role", "whatsapp_verified", "date_joined"]
        read_only_fields = ["id", "phone", "role", "whatsapp_verified", "date_joined"]
