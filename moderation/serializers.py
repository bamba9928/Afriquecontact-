from __future__ import annotations

from rest_framework import serializers

from moderation.models import Signalement
from pros.models import ProfilProfessionnel


class SignalementCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création d'un nouveau signalement.
    """
    professional_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Signalement
        fields = ["professional_id", "raison", "message"]

    def validate_professional_id(self, value: int) -> int:
        # Vérifier si le professionnel existe
        try:
            professionnel = ProfilProfessionnel.objects.get(pk=value)
        except ProfilProfessionnel.DoesNotExist:
            raise serializers.ValidationError("Profil professionnel introuvable.")

        # Empêcher l'auto-signalement
        requete = self.context.get("request")
        if requete and getattr(requete.user, "pro_profile", None):
            if requete.user.pro_profile.id == professionnel.id:
                raise serializers.ValidationError("Vous ne pouvez pas signaler votre propre profil.")

        return value

    def create(self, donnees_validees):
        professionnel = ProfilProfessionnel.objects.get(pk=donnees_validees["professional_id"])
        return Signalement.objects.create(
            auteur=self.context["request"].user,
            professionnel=professionnel,
            raison=donnees_validees["raison"],
            message=donnees_validees.get("message", ""),
        )


class SignalementSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'affichage détaillé des signalements.
    """
    telephone_auteur = serializers.CharField(source="auteur.phone", read_only=True)
    nom_entreprise_pro = serializers.CharField(source="professionnel.business_name", read_only=True)

    class Meta:
        model = Signalement
        fields = [
            "id",
            "auteur",
            "telephone_auteur",
            "professionnel",
            "nom_entreprise_pro",
            "raison",
            "message",
            "statut",
            "traite_par",
            "cree_le",
            "traite_le",
        ]
        read_only_fields = [
            "id",
            "auteur",
            "telephone_auteur",
            "professionnel",
            "nom_entreprise_pro",
            "traite_par",
            "cree_le",
            "traite_le",
        ]


class SignalementStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour mettre à jour uniquement le statut du signalement.
    """
    class Meta:
        model = Signalement
        fields = ["statut"]