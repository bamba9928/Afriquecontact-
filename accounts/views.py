from rest_framework import generics, permissions
from rest_framework.response import Response

from accounts.serializers import RegisterSerializer, VerifyWhatsappSerializer, MeSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class VerifyWhatsappView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = VerifyWhatsappSerializer


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MeSerializer

    def get_object(self):
        return self.request.user
