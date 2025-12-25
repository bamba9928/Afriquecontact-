# annonces/views.py
from __future__ import annotations

import django_filters
from django.db.models import Q, F
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, filters, status
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from billing.models import Subscription
from pros.permissions import EstAdministrateur
from .models import Annonce
from .serializers import AnnonceSerializer, AnnoncePublicSerializer


def parse_bool(v) -> bool:
    if isinstance(v, bool):
        return v
    s = str(v).strip().lower()
    return s in ("1", "true", "yes", "y", "on")


class AnnonceFilter(django_filters.FilterSet):
    # accepte id OU slug
    categorie = django_filters.CharFilter(method="filter_categorie")
    zone_geographique = django_filters.CharFilter(method="filter_zone")
    type = django_filters.CharFilter(field_name="type")

    class Meta:
        model = Annonce
        fields = ["type", "categorie", "zone_geographique"]

    def filter_categorie(self, qs, name, value):
        if value.isdigit():
            return qs.filter(categorie_id=int(value))
        return qs.filter(categorie__slug=value)

    def filter_zone(self, qs, name, value):
        if value.isdigit():
            return qs.filter(zone_geographique_id=int(value))
        return qs.filter(zone_geographique__slug=value)


class AnnonceCreateView(generics.CreateAPIView):
    """
    Création :
    - DEMANDE : gratuit
    - OFFRE : abonnement actif requis
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AnnonceSerializer

    def perform_create(self, serializer):
        type_annonce = self.request.data.get("type")

        if type_annonce == Annonce.TypeAnnonce.OFFRE:
            sub = Subscription.objects.filter(
                user=self.request.user,
                status=Subscription.Status.ACTIVE,
            ).first()
            if not sub or not sub.is_active():
                raise ValidationError({
                    "subscription": "Un abonnement actif est requis pour publier une offre d'emploi (1000F/mois)."
                })

        serializer.save(auteur=self.request.user)


class AnnoncePublicListView(generics.ListAPIView):
    """
    Liste publique (annonces approuvées) + filtres + recherche.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = AnnoncePublicSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AnnonceFilter
    search_fields = ["titre", "description"]
    ordering_fields = ["cree_le", "nb_vues"]
    ordering = ["-cree_le"]

    def get_queryset(self):
        return (
            Annonce.objects.filter(est_approuvee=True)
            .select_related("categorie", "auteur", "zone_geographique")
            .order_by("-cree_le")
        )


class AnnonceSearchView(generics.ListAPIView):
    """
    GET /annonces/search/?q=...
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = AnnoncePublicSerializer

    def get_queryset(self):
        q = (self.request.query_params.get("q") or "").strip()
        if not q:
            return Annonce.objects.none()
        return (
            Annonce.objects.filter(est_approuvee=True)
            .select_related("categorie", "auteur", "zone_geographique")
            .filter(Q(titre__icontains=q) | Q(description__icontains=q))
            .order_by("-cree_le")[:50]
        )


class MesAnnoncesListView(generics.ListAPIView):
    """
    Mes annonces (toutes, approuvées ou non).
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AnnonceSerializer

    def get_queryset(self):
        return (
            Annonce.objects.filter(auteur=self.request.user)
            .select_related("categorie", "zone_geographique")
            .order_by("-cree_le")
        )


class AnnonceDetailView(generics.RetrieveAPIView):
    """
    Public si approuvée, sinon accessible uniquement à l'auteur ou admin.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = AnnoncePublicSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Annonce.objects.select_related("categorie", "auteur", "zone_geographique")

    def get_object(self):
        obj = super().get_object()
        if obj.est_approuvee:
            return obj

        user = self.request.user
        if user.is_authenticated and (user.is_staff or obj.auteur_id == user.id):
            # si non approuvée mais auteur/admin => on renvoie version complète
            self.serializer_class = AnnonceSerializer
            return obj

        raise NotFound()


class AnnonceUpdateView(generics.UpdateAPIView):
    """
    Update auteur (ou admin). Toute modification remet l'annonce en attente => est_approuvee=False.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AnnonceSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Annonce.objects.select_related("auteur", "categorie", "zone_geographique")

    def perform_update(self, serializer):
        annonce = self.get_object()
        user = self.request.user
        if not (user.is_staff or annonce.auteur_id == user.id):
            raise PermissionDenied("Non autorisé.")

        obj = serializer.save()
        # si l’auteur modifie, repasse en attente de modération
        if not user.is_staff:
            Annonce.objects.filter(pk=obj.pk).update(est_approuvee=False)


class AnnonceDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "slug"

    def get_queryset(self):
        return Annonce.objects.select_related("auteur")

    def perform_destroy(self, instance):
        user = self.request.user
        if not (user.is_staff or instance.auteur_id == user.id):
            raise PermissionDenied("Non autorisé.")
        instance.delete()


class AdminApprobationAnnonceView(generics.UpdateAPIView):
    """
    Admin : approuver / rejeter (masquer).
    """
    permission_classes = [permissions.IsAuthenticated, EstAdministrateur]
    serializer_class = AnnonceSerializer
    queryset = Annonce.objects.all()
    lookup_field = "slug"

    def patch(self, request, *args, **kwargs):
        annonce = self.get_object()
        approbation = parse_bool(request.data.get("est_approuvee", False))
        annonce.est_approuvee = approbation
        annonce.save(update_fields=["est_approuvee"])
        status_msg = "approuvée" if approbation else "rejetée / masquée"
        return Response({"detail": f"Annonce {status_msg} avec succès."})


class AnnonceViewIncrement(APIView):
    """
    POST /annonces/<slug>/view/  => incrémente nb_vues
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, slug: str):
        updated = Annonce.objects.filter(slug=slug, est_approuvee=True).update(nb_vues=F("nb_vues") + 1)
        if not updated:
            raise NotFound()
        return Response({"ok": True}, status=status.HTTP_200_OK)

class AnnonceSearchView(generics.ListAPIView):
    """
    GET /annonces/search/?q=...
    (public only)
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = AnnoncePublicSerializer

    def get_queryset(self):
        q = (self.request.query_params.get("q") or "").strip()
        if not q:
            return Annonce.objects.none()
        return (
            Annonce.objects.filter(est_approuvee=True)
            .select_related("categorie", "auteur", "zone_geographique")
            .filter(Q(titre__icontains=q) | Q(description__icontains=q))
            .order_by("-cree_le")[:50]
        )


class AnnonceDetailView(generics.RetrieveAPIView):
    """
    GET /annonces/<slug>/
    Public si approuvée, sinon auteur/admin.
    """
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Annonce.objects.select_related("categorie", "auteur", "zone_geographique")

    def get_serializer_class(self):
        # par défaut public
        return AnnoncePublicSerializer

    def get_object(self):
        obj = super().get_object()
        if obj.est_approuvee:
            return obj

        user = self.request.user
        if user.is_authenticated and (user.is_staff or obj.auteur_id == user.id):
            # pour auteur/admin : serializer complet
            self._force_full = True
            return obj
        raise NotFound()

    def get_serializer(self, *args, **kwargs):
        # hack propre pour basculer le serializer en fonction de l’accès
        if getattr(self, "_force_full", False):
            self.serializer_class = AnnonceSerializer
        return super().get_serializer(*args, **kwargs)


class AnnonceUpdateView(generics.UpdateAPIView):
    """
    PATCH/PUT /annonces/<slug>/modifier/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AnnonceSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Annonce.objects.select_related("auteur", "categorie", "zone_geographique")

    def perform_update(self, serializer):
        annonce = self.get_object()
        user = self.request.user
        if not (user.is_staff or annonce.auteur_id == user.id):
            raise PermissionDenied("Non autorisé.")

        obj = serializer.save()

        # si l'auteur modifie => repasse en attente de modération
        if not user.is_staff:
            Annonce.objects.filter(pk=obj.pk).update(est_approuvee=False)


class AnnonceDeleteView(generics.DestroyAPIView):
    """
    DELETE /annonces/<slug>/supprimer/
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "slug"

    def get_queryset(self):
        return Annonce.objects.select_related("auteur")

    def perform_destroy(self, instance):
        user = self.request.user
        if not (user.is_staff or instance.auteur_id == user.id):
            raise PermissionDenied("Non autorisé.")
        instance.delete()


class AnnonceViewIncrement(APIView):
    """
    POST /annonces/<slug>/view/
    Incrémente nb_vues (public only approuvées)
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, slug: str):
        updated = Annonce.objects.filter(slug=slug, est_approuvee=True).update(nb_vues=F("nb_vues") + 1)
        if not updated:
            raise NotFound()
        return Response({"ok": True}, status=status.HTTP_200_OK)
