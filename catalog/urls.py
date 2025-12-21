from django.urls import path
from catalog.views import JobsListView, LocationsListView

urlpatterns = [
    path("jobs/", JobsListView.as_view()),
    path("locations/", LocationsListView.as_view()),
]
