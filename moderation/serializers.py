from __future__ import annotations
from rest_framework import serializers
from moderation.models import Signalement
from pros.models import ProfilProfessionnel


class SignalementCreateSerializer(serializers.ModelSerializer):
    """
    Serializer optimisé pour la création d'un signalement par un client (E1).
    """

    class Meta:
        model = Signalement
        fields = ["professionnel", "raison", "message"]

    def validate_professionnel(self, value):
        # 1. Vérifier que le pro est publié (on ne signale pas l'invisible)
        if not value.est_publie:
            raise serializers.ValidationError("Ce profil n'est pas public.")

        # 2. Empêcher l'auto-signalement
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if hasattr(request.user, 'pro_profile') and request.user.pro_profile == value:
                raise serializers.ValidationError("Vous ne pouvez pas vous signaler vous-même.")

            # 3. Anti-spam : Vérifier si un signalement est déjà ouvert pour ce pro par cet utilisateur
            exists = Signalement.objects.filter(
                auteur=request.user,
                professionnel=value,
                statut=Signalement.Statut.OUVERT
            ).exists()
            if exists:
                raise serializers.ValidationError("Vous avez déjà un signalement en cours pour ce professionnel.")

        return value


class SignalementSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour l'affichage (Admin et Client).
    """
    telephone_auteur = serializers.CharField(source="auteur.phone", read_only=True)
    nom_pro = serializers.CharField(source="professionnel.nom_entreprise", read_only=True)
    metier_pro = serializers.CharField(source="professionnel.metier.name", read_only=True)
    nom_admin = serializers.SerializerMethodField()

    class Meta:
        model = Signalement
        fields = [
            "id", "auteur", "telephone_auteur", "professionnel", "nom_pro",
            "metier_pro", "raison", "message", "statut", "note_admin",
            "traite_par", "nom_admin", "cree_le", "traite_le"
        ]
        read_only_fields = ["id", "auteur", "traite_par", "cree_le", "traite_le"]

    def get_nom_admin(self, obj):
        if obj.traite_par:
            # Retourne le nom si dispo, sinon le téléphone, sinon "Admin"
            return getattr(obj.traite_par, 'phone', "Admin")
        return "-"


class SignalementStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer utilisé par l'Admin pour traiter un signalement (E2/E3).
    """

    class Meta:
        model = Signalement
        fields = ["statut", "note_admin"]
        extra_kwargs = {
            "note_admin": {"required": True}  # Oblige l'admin à justifier sa décision
        }