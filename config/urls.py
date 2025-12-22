# config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/", include("accounts.urls")),
    path("api/pro/", include("pros.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/moderation/", include("moderation.urls")),
    path("api/", include("billing.urls")),  # checkout + webhook + subscriptions/me
    path("api/subscriptions/", include("billing.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
