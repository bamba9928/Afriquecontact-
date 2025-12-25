from django.urls import path
from catalog.views import (
    # jobs
    JobsListView,
    FeaturedJobsView,
    JobsSearchView,
    JobDetailView,
    # categories
    JobCategoriesTreeView,
    JobCategoryDetailView,
    JobCategoryChildrenView,
    # locations
    LocationsListView,
    LocationsTreeView,
    LocationsSearchView,
    LocationDetailView,
    LocationChildrenView,
)

urlpatterns = [
    # --- Jobs ---
    path("jobs/", JobsListView.as_view(), name="jobs-list"),
    path("jobs/featured/", FeaturedJobsView.as_view(), name="featured-jobs"),
    path("jobs/search/", JobsSearchView.as_view(), name="jobs-search"),
    path("jobs/<slug:slug>/", JobDetailView.as_view(), name="job-detail"),

    # --- Categories ---
    path("categories/tree/", JobCategoriesTreeView.as_view(), name="categories-tree"),
    path("categories/<slug:slug>/children/", JobCategoryChildrenView.as_view(), name="category-children"),
    path("categories/<slug:slug>/", JobCategoryDetailView.as_view(), name="category-detail"),

    # --- Locations ---
    path("locations/", LocationsListView.as_view(), name="locations-list"),
    path("locations/tree/", LocationsTreeView.as_view(), name="locations-tree"),
    path("locations/search/", LocationsSearchView.as_view(), name="locations-search"),
    path("locations/<slug:slug>/children/", LocationChildrenView.as_view(), name="location-children"),
    path("locations/<slug:slug>/", LocationDetailView.as_view(), name="location-detail"),
]
