from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # =============================================================================
    # ADMINISTRATION
    # =============================================================================
    path("admin/", admin.site.urls),
    path("health/", lambda request: JsonResponse({"status": "ok"}), name="health_check"),

    # =============================================================================
    # DOCUMENTATION API (Swagger/OpenAPI)
    # =============================================================================
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),

    # =============================================================================
    # FRONTEND - PAGES HTML
    # =============================================================================

    # Page d'accueil
    path("", TemplateView.as_view(template_name="home.html"), name="home"),

    # Pages d'authentification
    path("accounts/login/", TemplateView.as_view(template_name="accounts/login.html"), name="login_page"),
    path("accounts/register/", TemplateView.as_view(template_name="accounts/register.html"), name="register_page"),
    path("accounts/verify-otp/", TemplateView.as_view(template_name="accounts/verify_otp.html"),
         name="verify_otp_page"),

    # Pages de paiement (succès/échec)
    path("payment/success/", TemplateView.as_view(template_name="billing/success.html"), name="payment_success"),
    path("payment/cancel/", TemplateView.as_view(template_name="billing/cancel.html"), name="payment_cancel"),

    # =============================================================================
    # BACKEND - API REST
    # =============================================================================

    # Authentification et gestion des comptes (Login, Register, OTP, Profile)
    path("api/auth/", include("accounts.urls")),

    # Catalogue de référence (Métiers, Localisations)
    path("api/catalog/", include("catalog.urls")),

    # Professionnels (Recherche, Profils, Médias, Réalisations)
    path("api/pros/", include("pros.urls")),

    # Facturation et abonnements (Paiement 1000F, Webhooks)
    path("api/billing/", include("billing.urls")),

    # Annonces (Offres et demandes d'emploi)
    path("api/annonces/", include("annonces.urls")),

    # Marketing (Newsletters, Campagnes)
    path("api/marketing/", include("marketing.urls")),

    # Modération (Signalements, Vérifications)
    path("api/moderation/", include("moderation.urls")),
]

handler404 = 'config.views.custom_404'
handler500 = 'config.views.custom_500'
# =============================================================================
# FICHIERS STATIQUES ET MÉDIAS (Développement uniquement)
# =============================================================================
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)