from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Autorise la lecture à tous, mais n'autorise la modification/suppression
    que si l'utilisateur connecté est l'auteur de l'objet.
    """

    def has_object_permission(self, request, view, obj):
        # 1. Autoriser les méthodes de lecture (GET, HEAD, OPTIONS)
        # Note : Si la vue elle-même demande IsAuthenticated, un anonyme sera bloqué avant d'arriver ici.
        if request.method in permissions.SAFE_METHODS:
            return True

        # 2. Autoriser l'écriture (PUT, PATCH, DELETE) uniquement si l'auteur est l'utilisateur connecté
        # Assurez-vous que votre modèle Annonce a bien un champ 'auteur' (ForeignKey vers User)
        return obj.auteur == request.user