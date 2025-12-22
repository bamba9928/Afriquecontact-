from django.urls import path
from .views import CheckoutView, BictorysWebhookView, SubscriptionMeView

urlpatterns = [
    path("subscriptions/checkout/", CheckoutView.as_view(), name="subscriptions-checkout"),
    path("webhooks/bictorys/", BictorysWebhookView.as_view()),
    path("me/", SubscriptionMeView.as_view(), name="subscription_me"),
]
