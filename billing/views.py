from __future__ import annotations

import os
import uuid

from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status, generics

from .models import Subscription
from .serializers import SubscriptionMeSerializer

from accounts.models import User
from billing.models import Payment, Subscription
from billing.serializers import CheckoutSerializer
from billing.services import bictorys_create_checkout, verify_bictorys_signature


def _subscription_days() -> int:
    try:
        return int(os.getenv("SUBSCRIPTION_DAYS", "30"))
    except Exception:
        return 30


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if getattr(request.user, "role", None) != User.Role.PRO:
            return Response({"detail": "Réservé aux professionnels."}, status=status.HTTP_403_FORBIDDEN)

        ser = CheckoutSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        amount = ser.validated_data["amount"]
        currency = ser.validated_data["currency"]

        provider_ref = uuid.uuid4().hex  # référence interne (et envoyée au provider)

        with transaction.atomic():
            payment = Payment.objects.create(
                user=request.user,
                provider=Payment.Provider.BICTORYS,
                provider_ref=provider_ref,
                amount=amount,
                currency=currency,
                status=Payment.Status.PENDING,
            )

            checkout = bictorys_create_checkout(
                reference=payment.provider_ref,
                amount=payment.amount,
                currency=payment.currency,
                customer_phone=request.user.phone,
                metadata={"user_id": request.user.id},
            )

            payment.payload = {
                **(payment.payload or {}),
                "checkout": checkout.get("provider_payload", {}),
            }
            payment.save(update_fields=["payload"])

        return Response(
            {
                "payment": {
                    "id": payment.id,
                    "provider_ref": payment.provider_ref,
                    "status": payment.status,
                    "amount": payment.amount,
                    "currency": payment.currency,
                },
                "checkout_url": checkout["checkout_url"],
            },
            status=status.HTTP_201_CREATED,
        )


class BictorysWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # important: pas de JWT ici

    def post(self, request):
        raw = request.body or b""

        sig = (
            request.headers.get("X-Bictorys-Signature")
            or request.headers.get("X-Signature")
            or ""
        )
        if sig and not verify_bictorys_signature(raw, sig):
            return Response({"detail": "Signature invalide."}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data if isinstance(request.data, dict) else {}

        # champs usuels possibles
        provider_ref = data.get("reference") or data.get("provider_ref") or data.get("ref")
        event_status = (data.get("status") or "").upper()

        if not provider_ref:
            return Response({"detail": "reference manquante."}, status=status.HTTP_400_BAD_REQUEST)

        payment = Payment.objects.filter(provider_ref=provider_ref).first()
        if not payment:
            return Response({"detail": "payment introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # mapping statut (à ajuster selon Bictorys)
        if event_status in ("PAID", "SUCCESS", "SUCCEEDED", "COMPLETED"):
            if payment.status != Payment.Status.PAID:
                payment.payload = {**(payment.payload or {}), "webhook": data}
                payment.mark_paid()
                payment.save(update_fields=["payload"])

                # Activation abonnement
                days = _subscription_days()
                now = timezone.now()
                end = now + timezone.timedelta(days=days)

                sub, _ = Subscription.objects.get_or_create(user=payment.user)
                sub.status = Subscription.Status.ACTIVE
                sub.start_at = now
                sub.end_at = end
                sub.last_payment = payment
                sub.save(update_fields=["status", "start_at", "end_at", "last_payment", "updated_at"])

        elif event_status in ("FAILED", "ERROR"):
            payment.status = Payment.Status.FAILED
            payment.payload = {**(payment.payload or {}), "webhook": data}
            payment.save(update_fields=["status", "payload"])

        elif event_status in ("CANCELED", "CANCELLED"):
            payment.status = Payment.Status.CANCELED
            payment.payload = {**(payment.payload or {}), "webhook": data}
            payment.save(update_fields=["status", "payload"])

        else:
            # on garde PENDING mais on loggue le payload
            payment.payload = {**(payment.payload or {}), "webhook": data}
            payment.save(update_fields=["payload"])

        return Response({"ok": True})

class SubscriptionMeView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubscriptionMeSerializer

    def get_object(self):
        sub, _ = Subscription.objects.get_or_create(
            user=self.request.user,
            defaults={"status": Subscription.Status.EXPIRED},
        )
        return sub
