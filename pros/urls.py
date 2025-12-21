from django.urls import path
from .views import ProMeView, ProSearchView, ProPublishView, ProUnpublishView, AdminProPublishView, AdminProUnpublishView

urlpatterns = [
    path("me/", ProMeView.as_view(), name="pro_me"),
    path("search/", ProSearchView.as_view(), name="pro_search"),

    path("publish/", ProPublishView.as_view(), name="pro_publish"),
    path("unpublish/", ProUnpublishView.as_view(), name="pro_unpublish"),

    path("<int:pro_id>/publish/", AdminProPublishView.as_view(), name="admin_pro_publish"),
    path("<int:pro_id>/unpublish/", AdminProUnpublishView.as_view(), name="admin_pro_unpublish"),
]
