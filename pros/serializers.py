from rest_framework import serializers
from pros.models import ProfessionalProfile


class ProMeSerializer(serializers.ModelSerializer):
    user_phone = serializers.CharField(source="user.phone", read_only=True)
    whatsapp_verified = serializers.BooleanField(source="user.whatsapp_verified", read_only=True)

    class Meta:
        model = ProfessionalProfile
        fields = [
            "id",
            "user_phone",
            "whatsapp_verified",
            "business_name",
            "job",
            "location",
            "description",
            "call_phone",
            "whatsapp_phone",
            "avatar",
            "online_status",
            "is_published",
            "latitude",
            "longitude",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_published"]


class ProPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalProfile
        fields = [
            "id",
            "business_name",
            "job",
            "location",
            "description",
            "call_phone",
            "whatsapp_phone",
            "avatar",
            "online_status",
            "latitude",
            "longitude",
        ]
