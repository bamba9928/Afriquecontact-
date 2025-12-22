from django.urls import path
from catalog.views import JobsListView, LocationsListView, FeaturedJobsView, LocationsTreeView

urlpatterns = [
    path("jobs/", JobsListView.as_view()),
    path("locations/", LocationsListView.as_view()),
    path("jobs/featured/", FeaturedJobsView.as_view(), name="featured-jobs"),
    path("locations/tree/", LocationsTreeView.as_view(), name="locations-tree"),
]
