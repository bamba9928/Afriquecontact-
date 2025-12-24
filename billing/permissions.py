from django.db.models import Q
from django.utils import timezone
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import APIException

from .models import Subscription


class PaymentRequired(APIException):
    status_code = 402
    default_detail = "Abonnement requis ou expiré."
    default_code = "payment_required"


class HasActiveSubscription(BasePermission):
    """
    Autorise uniquement si Subscription ACTIVE et (end_at is null ou end_at > now).
    """
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        ok = Subscription.objects.filter(
            user=user,
            status=Subscription.Status.ACTIVE,
        ).filter(
            Q(end_at__isnull=True) | Q(end_at__gt=timezone.now())
        ).exists()

        if not ok:
            raise PaymentRequired()
        return True
