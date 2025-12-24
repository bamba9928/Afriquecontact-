from django.urls import path
from .views import CheckoutView, BictorysWebhookView, SubscriptionMeView

urlpatterns = [
    # --- Souscriptions ---
    # POST : Initier un paiement de 1000F
    path("checkout/", CheckoutView.as_view(), name="subscriptions-checkout"),

    # GET : Vérifier l'état de son abonnement (is_active, end_at)
    path("me/", SubscriptionMeView.as_view(), name="subscription-me"),

    # --- Webhooks (Notifications de paiement) ---
    # Endpoint appelé par Bictorys après le paiement (Public)
    path("webhooks/bictorys/", BictorysWebhookView.as_view(), name="bictorys-webhook"),
]