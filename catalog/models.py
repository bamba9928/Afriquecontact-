from __future__ import annotations
from django.db import models

class Location(models.Model):
    """
    Gère la hiérarchie géographique : Pays > Région > Ville > Quartier.
    """
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
        on_delete=models.CASCADE
    )
    slug = models.SlugField(max_length=160, unique=True)

    class Meta:
        # Empêche les doublons de noms au sein d'une même entité parente
        unique_together = ("parent", "name", "type")
        indexes = [
            models.Index(fields=["type"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["parent"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.type})"


class JobCategory(models.Model):
    """
    Gère les catégories et sous-catégories de métiers.
    """
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=160, unique=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="subcategories",
        on_delete=models.CASCADE
    )

    class Meta:
        verbose_name_plural = "Job Categories"
        unique_together = ("parent", "name")

    def __str__(self) -> str:
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name


class Job(models.Model):
    """
    Représente un métier spécifique lié à une catégorie ou sous-catégorie.
    """
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=160, unique=True)
    category = models.ForeignKey(
        JobCategory,
        related_name="jobs",
        on_delete=models.PROTECT
    )
    is_featured = models.BooleanField(
        default=False,
        help_text="Marquer comme métier très recherché"
    )

    class Meta:
        unique_together = ("category", "name")
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["is_featured"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self) -> str:
        return self.name