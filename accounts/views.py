from __future__ import annotations

import random
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from django.utils import timezone

from .models import User, WhatsAppOTP
from .serializers import (
    RegisterSerializer,
    VerifyWhatsappSerializer,
    MeSerializer,
    ResendOTPSerializer
)


class RegisterView(generics.CreateAPIView):
    """
    Inscription d'un utilisateur (Client ou Pro).
    Déclenche automatiquement l'envoi du code WhatsApp.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # On retourne les infos de l'utilisateur + un message d'instruction
        return Response({
            "user_id": user.id,
            "phone": user.phone,
            "message": "Inscription réussie. Un code de vérification a été envoyé sur WhatsApp."
        }, status=status.HTTP_201_CREATED)


class VerifyWhatsappView(views.APIView):
    """
    Vérification du code OTP reçu par WhatsApp.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyWhatsappSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # La logique de validation est encapsulée dans le serializer
        user = serializer.save()

        return Response({
            "detail": "Votre compte WhatsApp a été vérifié avec succès.",
            "whatsapp_verified": user.whatsapp_verified
        }, status=status.HTTP_200_OK)


class ResendOTPView(views.APIView):
    """
    Permet de renvoyer un code si l'utilisateur ne l'a pas reçu.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Logique d'envoi (via service externe) appelée ici
        phone = serializer.validated_data['phone']
        # dummy_send_whatsapp(phone, new_code)

        return Response({
            "detail": "Un nouveau code a été envoyé."
        }, status=status.HTTP_200_OK)


class MeView(generics.RetrieveUpdateAPIView):
    """
    Gestion du profil personnel (GET pour voir, PATCH pour modifier).
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MeSerializer

    def get_object(self):
        return self.request.user