from __future__ import annotations

import uuid
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from billing.models import Payment, Subscription


SUB_DURATION_DAYS = 30
SUB_AMOUNT_XOF = 1000


class CheckoutSerializer(serializers.Serializer):
    amount = serializers.IntegerField(required=False, min_value=100)
    currency = serializers.CharField(required=False, default="XOF")

    def create(self, validated_data):
        user = self.context["request"].user
        amount = validated_data.get("amount") or SUB_AMOUNT_XOF
        currency = validated_data.get("currency") or "XOF"

        provider_ref = f"bict_{uuid.uuid4().hex}"

        payment = Payment.objects.create(
            user=user,
            provider=Payment.Provider.BICTORYS,
            provider_ref=provider_ref,
            amount=amount,
            currency=currency,
            status=Payment.Status.PENDING,
            payload={},
        )

        # MVP: checkout_url fictif (plus tard: appel API Bictorys)
        checkout_url = f"http://localhost:8000/mock/checkout/{provider_ref}"

        return {
            "provider": payment.provider,
            "provider_ref": payment.provider_ref,
            "amount": payment.amount,
            "currency": payment.currency,
            "checkout_url": checkout_url,
        }


class WebhookSerializer(serializers.Serializer):
    provider_ref = serializers.CharField()
    status = serializers.ChoiceField(choices=["PAID", "FAILED", "CANCELED"])
    payload = serializers.JSONField(required=False)

    def create(self, validated_data):
        provider_ref = validated_data["provider_ref"]
        status = validated_data["status"]
        payload = validated_data.get("payload") or {}

        payment = Payment.objects.get(provider_ref=provider_ref)
        payment.payload = payload

        if status == "PAID":
            payment.mark_paid()

            sub, _ = Subscription.objects.get_or_create(user=payment.user)
            sub.status = Subscription.Status.ACTIVE
            sub.start_at = timezone.now()
            sub.end_at = timezone.now() + timedelta(days=SUB_DURATION_DAYS)
            sub.last_payment = payment
            sub.save()

        elif status == "FAILED":
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status", "payload"])

        else:
            payment.status = Payment.Status.CANCELED
            payment.save(update_fields=["status", "payload"])

        return {"detail": "Webhook traité."}


class SubscriptionMeSerializer(serializers.ModelSerializer):
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = ["status", "start_at", "end_at", "is_active", "last_payment"]

    def get_is_active(self, obj):
        return obj.is_active()
