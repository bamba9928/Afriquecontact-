from rest_framework.permissions import BasePermission
from accounts.models import User

class EstProfessionnel(BasePermission):
    """
    Permission permettant l'accès uniquement aux utilisateurs ayant le rôle 'PRO'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, "role", None) == "PRO"
        )

class EstAdministrateur(BasePermission):
    """
    Permission permettant l'accès uniquement aux utilisateurs ayant le rôle administrateur.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.ADMIN
        )