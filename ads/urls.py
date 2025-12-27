from django.urls import path
from .views import PubliciteListView

urlpatterns = [
    path("", PubliciteListView.as_view(), name="ads-list"),
]