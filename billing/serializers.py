from __future__ import annotations
from rest_framework import serializers
from django.utils import timezone
from billing.models import Payment, Subscription

# Montant de base du cahier des charges
SUB_AMOUNT_XOF = 1000

class CheckoutSerializer(serializers.Serializer):
    """
    Valide les données entrantes pour initier un paiement.
    """
    amount = serializers.IntegerField(required=False, default=SUB_AMOUNT_XOF, min_value=100)
    currency = serializers.CharField(required=False, default="XOF")

    def validate_amount(self, value):
        # Sécurité : On s'assure que le montant n'est pas inférieur au prix du service
        if value < SUB_AMOUNT_XOF:
            raise serializers.ValidationError(f"Le montant minimum est de {SUB_AMOUNT_XOF} XOF.")
        return value


class SubscriptionMeSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'état de l'abonnement (utilisé par SubscriptionMeView).
    """
    is_active = serializers.BooleanField(source="is_active", read_only=True)
    days_left = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            "status",
            "start_at",
            "end_at",
            "is_active",
            "days_left",
            "last_payment"
        ]

    def get_days_left(self, obj):
        """Calcule le nombre de jours restants pour l'affichage mobile."""
        if obj.is_active() and obj.end_at:
            delta = obj.end_at - timezone.now()
            # On retourne 0 si c'est négatif ou expiré
            return max(0, delta.days)
        return 0


class PaymentSerializer(serializers.ModelSerializer):
    """
    Optionnel : Pour afficher l'historique des paiements au professionnel.
    """
    class Meta:
        model = Payment
        fields = [
            "id",
            "provider_ref",
            "amount",
            "currency",
            "status",
            "created_at",
            "paid_at"
        ]
        read_only_fields = ["id", "status", "created_at", "paid_at"]