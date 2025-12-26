from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

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
    # Accessible via /api/annonces/
    path("api/annonces/", include("annonces.urls")),
    path("api/marketing/", include("marketing.urls")),

    # Modération (Signalements)
    # Accessible via /api/moderation/
    path("api/moderation/", include("moderation.urls")),
    path('accounts/login/', TemplateView.as_view(template_name='accounts/login.html'), name='login_page'),
    path('accounts/register/', TemplateView.as_view(template_name='accounts/register.html'), name='register_page'),
    path('accounts/verify-otp/', TemplateView.as_view(template_name='accounts/verify_otp.html'), name='verify_otp_page'),
]

# Gestion des fichiers média (Avatars, Photos de réalisations, CV) en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)