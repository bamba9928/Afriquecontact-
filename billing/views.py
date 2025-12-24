from __future__ import annotations

import os
import uuid
from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status, generics

from accounts.models import User
from billing.models import Payment, Subscription
from billing.serializers import CheckoutSerializer, SubscriptionMeSerializer
from billing.services import bictorys_create_checkout, verify_bictorys_signature


class CheckoutView(APIView):
    """
    Crée une intention de paiement (1000F) et génère l'URL Bictorys.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Sécurité : Un client simple ne peut pas souscrire à un pack Pro
        if getattr(request.user, "role", None) != User.Role.PRO:
            return Response(
                {"detail": "Seuls les professionnels peuvent souscrire à un abonnement."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data["amount"]
        currency = serializer.validated_data["currency"]

        # Référence unique pour Bictorys (Checkout Token)
        provider_ref = uuid.uuid4().hex

        with transaction.atomic():
            payment = Payment.objects.create(
                user=request.user,
                provider=Payment.Provider.BICTORYS,
                provider_ref=provider_ref,
                amount=amount,
                currency=currency,
                status=Payment.Status.PENDING,
            )

            # Appel au service Bictorys (Sénégal)
            try:
                checkout = bictorys_create_checkout(
                    reference=payment.provider_ref,
                    amount=payment.amount,
                    currency=payment.currency,
                    customer_phone=request.user.phone,
                    metadata={"user_id": request.user.id},
                )

                payment.payload = {"checkout": checkout.get("provider_payload", {})}
                payment.save(update_fields=["payload"])

                return Response({
                    "payment_id": payment.id,
                    "checkout_url": checkout["checkout_url"],
                    "provider_ref": payment.provider_ref
                }, status=status.HTTP_201_CREATED)

            except Exception as e:
                # En cas d'échec de communication avec la passerelle
                return Response(
                    {"detail": "Erreur lors de la communication avec Bictorys."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )


class BictorysWebhookView(APIView):
    """
    Réceptionne les notifications de paiement de Bictorys.
    C'est ici que l'abonnement s'active automatiquement (PAID).
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # Pas de JWT pour les appels externes

    def post(self, request):
        raw_body = request.body
        signature = request.headers.get("X-Bictorys-Signature")

        # 1. Vérification de sécurité (Authenticité de l'appel)
        if not verify_bictorys_signature(raw_body, signature):
            return Response({"detail": "Signature invalide"}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        provider_ref = data.get("reference")
        event_status = (data.get("status") or "").upper()

        if not provider_ref:
            return Response({"detail": "Référence manquante"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Récupération du paiement
        payment = Payment.objects.filter(provider_ref=provider_ref).first()
        if not payment:
            return Response({"detail": "Paiement non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        # 3. Traitement selon le statut renvoyé
        if event_status in ("PAID", "SUCCESS", "COMPLETED"):
            if payment.status != Payment.Status.PAID:
                payment.payload = {**(payment.payload or {}), "webhook": data}
                # mark_as_paid() déclenche l'activation de l'abonnement et la visibilité du profil
                payment.mark_as_paid()

        elif event_status in ("FAILED", "CANCELED", "EXPIRED"):
            payment.status = Payment.Status.FAILED
            payment.payload = {**(payment.payload or {}), "webhook": data}
            payment.save(update_fields=["status", "payload"])

        return Response({"status": "processed"}, status=status.HTTP_200_OK)


class SubscriptionMeView(generics.RetrieveAPIView):
    """
    Permet au pro de vérifier son état : GET /api/subscriptions/me/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubscriptionMeSerializer

    def get_object(self):
        sub, _ = Subscription.objects.get_or_create(user=self.request.user)
        return sub