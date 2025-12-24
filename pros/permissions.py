from rest_framework.permissions import BasePermission
from accounts.models import User

class EstProfessionnel(BasePermission):
    """
    Permission permettant l'accès uniquement aux utilisateurs ayant le rôle 'PRO'.
    Vérifie également que l'utilisateur est bien authentifié.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.PRO
        )

class EstAdministrateur(BasePermission):
    """
    Permission permettant l'accès uniquement aux utilisateurs ayant le rôle 'ADMIN'.
    Indispensable pour les actions de modération et de gestion du catalogue.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.ADMIN
        )