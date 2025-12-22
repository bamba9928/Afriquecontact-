from django.urls import path
from .views import AnnonceCreateView, AnnonceListView

urlpatterns = [
    path("annonces/", AnnonceListView.as_view(), name="annonce_liste"),
    path("annonces/creer/", AnnonceCreateView.as_view(), name="annonce_creer"),
]