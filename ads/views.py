from rest_framework import generics, permissions
from django.utils import timezone
from .models import Publicite
from .serializers import PubliciteSerializer

class PubliciteListView(generics.ListAPIView):
    """
    Retourne les publicités actives pour le défilement (Espace Pub).
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = PubliciteSerializer

    def get_queryset(self):
        now = timezone.now()
        # Retourne les pubs actives dont la date de fin n'est pas passée
        return Publicite.objects.filter(
            est_active=True,
            date_debut__lte=now,
            date_fin__gte=now
        ).order_by("-cree_le")