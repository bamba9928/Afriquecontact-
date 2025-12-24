from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, VerifyWhatsappView, MeView, ResendOTPView

urlpatterns = [
    # --- Inscription & Authentification ---
    # POST : Crée le compte et le profil pro + envoie l'OTP
    path("register/", RegisterView.as_view(), name="auth-register"),

    # POST : Connexion classique (retourne Access + Refresh tokens)
    path("login/", TokenObtainPairView.as_view(), name="auth-login"),

    # POST : Renouvellement du token d'accès sans se reconnecter
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),

    # --- Vérification WhatsApp (OTP) ---
    # POST : Valide le code et active le compte
    path("verify-whatsapp/", VerifyWhatsappView.as_view(), name="auth-verify-whatsapp"),

    # POST : Permet de renvoyer un code en cas de problème de réseau
    path("resend-otp/", ResendOTPView.as_view(), name="auth-resend-otp"),

    # --- Profil Utilisateur ---
    # GET/PATCH : Informations sur l'utilisateur connecté
    path("me/", MeView.as_view(), name="auth-me"),
]