from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # --- Interface d'administration ---
    path("admin/", admin.site.urls),

    # --- Documentation API (Swagger) ---
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),

    # --- Modules métier ---

    # Authentification et Comptes (OTP, Login, Register)
    path("api/auth/", include("accounts.urls")),

    # Catalogue (Métiers et Localisations)
    path("api/catalog/", include("catalog.urls")),

    # Professionnels (Recherche, Profils, Médias)
    path("api/pros/", include("pros.urls")),

    # Facturation et Abonnements (Paiement 1000F, Webhooks)
    # Accessible via /api/billing/checkout/ ou /api/billing/me/
    path("api/billing/", include("billing.urls")),

    # Annonces (Offres et Demandes d'emploi)
    path("api/ads/", include("ads.urls")),
    # Accessible via /api/annonces/
    path("api/annonces/", include("annonces.urls")),

    # Modération (Signalements)
    # Accessible via /api/moderation/
    path("api/moderation/", include("moderation.urls")),
]

# Gestion des fichiers média (Avatars, Photos de réalisations, CV) en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)