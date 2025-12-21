from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import RegisterView, VerifyWhatsappView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("verify-whatsapp/", VerifyWhatsappView.as_view(), name="verify_whatsapp"),

    path("login/", TokenObtainPairView.as_view(), name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
]
