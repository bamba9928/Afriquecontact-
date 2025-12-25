from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify


def make_unique_slug(model_cls: type[models.Model], base: str, *, max_len: int = 160, pk=None) -> str:
    base_slug = (slugify(base)[:max_len] or "item").strip("-")
    slug = base_slug
    i = 2
    qs = model_cls.objects.all()
    if pk is not None:
        qs = qs.exclude(pk=pk)

    while qs.filter(slug=slug).exists():
        suffix = f"-{i}"
        slug = f"{base_slug[: max_len - len(suffix)]}{suffix}"
        i += 1
    return slug


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Location(TimeStampedModel):
    """
    Hiérarchie géographique : Pays > Région > Ville > Quartier.
    """
    class Type(models.TextChoices):
        COUNTRY = "COUNTRY", "Pays"
        REGION = "REGION", "Région"
        CITY = "CITY", "Ville"
        DISTRICT = "DISTRICT", "Quartier"

    name = models.CharField(max_length=120)
    type = models.CharField(max_length=10, choices=Type.choices, db_index=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="children",
        on_delete=models.CASCADE,
        db_index=True,
    )
    slug = models.SlugField(max_length=160, unique=True, blank=True)

    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["parent", "name", "type"], name="uq_location_parent_name_type"),
        ]
        indexes = [
            models.Index(fields=["parent", "type"]),  # requête fréquente: children d’un parent par type
            models.Index(fields=["slug"]),
        ]

    def clean(self):
        # Règles de hiérarchie (simple et concret)
        if self.type == self.Type.COUNTRY and self.parent is not None:
            raise ValidationError({"parent": "Un pays ne doit pas avoir de parent."})

        if self.type == self.Type.REGION:
            if self.parent is None or self.parent.type != self.Type.COUNTRY:
                raise ValidationError({"parent": "Une région doit avoir comme parent un pays."})

        if self.type == self.Type.CITY:
            if self.parent is None or self.parent.type != self.Type.REGION:
                raise ValidationError({"parent": "Une ville doit avoir comme parent une région."})

        if self.type == self.Type.DISTRICT:
            if self.parent is None or self.parent.type != self.Type.CITY:
                raise ValidationError({"parent": "Un quartier doit avoir comme parent une ville."})

        # anti-boucle basique
        if self.parent_id and self.parent_id == self.pk:
            raise ValidationError({"parent": "Une location ne peut pas être son propre parent."})

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.name}-{self.type}"
            self.slug = make_unique_slug(Location, base, max_len=160, pk=self.pk)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.name} ({self.type})"


class JobCategory(TimeStampedModel):
    """
    Catégories et sous-catégories de métiers.
    """
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="subcategories",
        on_delete=models.CASCADE,
        db_index=True,
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name_plural = "Job Categories"
        constraints = [
            models.UniqueConstraint(fields=["parent", "name"], name="uq_jobcategory_parent_name"),
        ]
        indexes = [
            models.Index(fields=["parent"]),
            models.Index(fields=["slug"]),
        ]

    def clean(self):
        if self.parent_id and self.parent_id == self.pk:
            raise ValidationError({"parent": "Une catégorie ne peut pas être son propre parent."})

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.name}-{self.parent.name}" if self.parent else self.name
            self.slug = make_unique_slug(JobCategory, base, max_len=160, pk=self.pk)
        super().save(*args, **kwargs)

    @property
    def full_name(self) -> str:
        return f"{self.parent.name} > {self.name}" if self.parent else self.name

    def __str__(self) -> str:
        return self.full_name


class Job(TimeStampedModel):
    """
    Métier spécifique lié à une sous-catégorie.
    """
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    category = models.ForeignKey(JobCategory, related_name="jobs", on_delete=models.PROTECT, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)

    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["category", "name"], name="uq_job_category_name"),
        ]
        indexes = [
            models.Index(fields=["category", "is_featured"]),
            models.Index(fields=["slug"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.name}-{self.category.name}"
            self.slug = make_unique_slug(Job, base, max_len=160, pk=self.pk)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name
