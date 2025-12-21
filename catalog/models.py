from __future__ import annotations
from django.db import models


class Location(models.Model):
    class Type(models.TextChoices):
        COUNTRY = "COUNTRY", "Pays"
        REGION = "REGION", "Région"
        CITY = "CITY", "Ville"
        DISTRICT = "DISTRICT", "Quartier"

    name = models.CharField(max_length=120)
    type = models.CharField(max_length=10, choices=Type.choices)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="children",
        on_delete=models.CASCADE,
    )

    slug = models.SlugField(max_length=160, unique=True)

    class Meta:
        unique_together = ("parent", "name", "type")
        indexes = [
            models.Index(fields=["type"]),
            models.Index(fields=["parent"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.type})"


class JobCategory(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=160, unique=True)

    def __str__(self) -> str:
        return self.name


class Job(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=160, unique=True)
    category = models.ForeignKey(JobCategory, related_name="jobs", on_delete=models.PROTECT)
    is_featured = models.BooleanField(default=False)  # métiers “les plus recherchés”

    class Meta:
        unique_together = ("category", "name")
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["is_featured"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self) -> str:
        return self.name
