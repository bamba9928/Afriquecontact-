from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAuthorOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and (request.user.is_staff or obj.auteur_id == request.user.id))
