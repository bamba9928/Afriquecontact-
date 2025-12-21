from __future__ import annotations
from django.conf import settings
from django.db import models

from catalog.models import Job, Location


class ProfessionalProfile(models.Model):
    class OnlineStatus(models.TextChoices):
        ONLINE = "ONLINE", "En ligne"
        OFFLINE = "OFFLINE", "Hors service"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="pro_profile", on_delete=models.CASCADE)

    business_name = models.CharField(max_length=160)  # nom commercial
    job = models.ForeignKey(Job, related_name="pros", on_delete=models.PROTECT)
    location = models.ForeignKey(Location, related_name="pros", on_delete=models.PROTECT)

    description = models.TextField(blank=True)

    call_phone = models.CharField(max_length=32)
    whatsapp_phone = models.CharField(max_length=32)

    avatar = models.ImageField(upload_to="pros/avatars/", null=True, blank=True)

    online_status = models.CharField(max_length=10, choices=OnlineStatus.choices, default=OnlineStatus.ONLINE)
    is_published = models.BooleanField(default=False)

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["job"]),
            models.Index(fields=["location"]),
            models.Index(fields=["is_published"]),
            models.Index(fields=["online_status"]),
        ]

    def __str__(self) -> str:
        return f"{self.business_name} ({self.user.phone})"


class ProMedia(models.Model):
    class Kind(models.TextChoices):
        PHOTO = "PHOTO", "Photo"
        VIDEO = "VIDEO", "Vidéo"
        CV = "CV", "CV"

    pro = models.ForeignKey(ProfessionalProfile, related_name="media", on_delete=models.CASCADE)
    kind = models.CharField(max_length=10, choices=Kind.choices)
    file = models.FileField(upload_to="pros/media/")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["pro", "kind"])]

    def __str__(self) -> str:
        return f"{self.pro_id} {self.kind}"


class FavoriteContact(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="favorites", on_delete=models.CASCADE)
    pro = models.ForeignKey(ProfessionalProfile, related_name="favorited_by", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("owner", "pro")
        indexes = [models.Index(fields=["owner"])]

    def __str__(self) -> str:
        return f"Fav({self.owner_id} -> {self.pro_id})"
