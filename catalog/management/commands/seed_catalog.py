from __future__ import annotations

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from catalog.models import Location, JobCategory, Job


def unique_slug(model, base: str) -> str:
    base = slugify(base)[:150] or "item"
    slug = base
    i = 2
    while model.objects.filter(slug=slug).exists():
        slug = f"{base}-{i}"
        i += 1
    return slug


class Command(BaseCommand):
    help = "Seed catalog: locations + jobs"

    def handle(self, *args, **options):
        # ----- Locations (exemple Sénégal)
        senegal, _ = Location.objects.get_or_create(
            type=Location.Type.COUNTRY,
            parent=None,
            name="Sénégal",
            defaults={"slug": unique_slug(Location, "senegal")},
        )

        dakar_region, _ = Location.objects.get_or_create(
            type=Location.Type.REGION,
            parent=senegal,
            name="Dakar",
            defaults={"slug": unique_slug(Location, "dakar-region")},
        )

        dakar_city, _ = Location.objects.get_or_create(
            type=Location.Type.CITY,
            parent=dakar_region,
            name="Dakar",
            defaults={"slug": unique_slug(Location, "dakar")},
        )

        for district in ["Plateau", "Médina", "Parcelles Assainies", "Yoff", "Ouakam", "Almadies"]:
            Location.objects.get_or_create(
                type=Location.Type.DISTRICT,
                parent=dakar_city,
                name=district,
                defaults={"slug": unique_slug(Location, f"dakar-{district}")},
            )

        thies_region, _ = Location.objects.get_or_create(
            type=Location.Type.REGION,
            parent=senegal,
            name="Thiès",
            defaults={"slug": unique_slug(Location, "thies-region")},
        )

        thies_city, _ = Location.objects.get_or_create(
            type=Location.Type.CITY,
            parent=thies_region,
            name="Thiès",
            defaults={"slug": unique_slug(Location, "thies")},
        )

        for district in ["Grand Standing", "Cité Lamy", "Randoulène"]:
            Location.objects.get_or_create(
                type=Location.Type.DISTRICT,
                parent=thies_city,
                name=district,
                defaults={"slug": unique_slug(Location, f"thies-{district}")},
            )

        # ----- Jobs
        categories = {
            "BTP / Travaux": ["Plombier", "Électricien", "Maçon", "Peintre", "Menuisier", "Carreleur"],
            "Maison / Services": ["Femme de ménage", "Gardien", "Jardinier"],
            "Auto / Moto": ["Mécanicien", "Électricien auto", "Vulcanisateur"],
            "Informatique": ["Développeur", "Technicien réseau", "Réparateur téléphone"],
        }

        featured = {"Plombier", "Électricien", "Mécanicien", "Femme de ménage"}

        for cat_name, jobs in categories.items():
            cat, _ = JobCategory.objects.get_or_create(
                name=cat_name,
                defaults={"slug": unique_slug(JobCategory, cat_name)},
            )
            for job_name in jobs:
                Job.objects.get_or_create(
                    category=cat,
                    name=job_name,
                    defaults={
                        "slug": unique_slug(Job, job_name),
                        "is_featured": job_name in featured,
                    },
                )

        self.stdout.write(self.style.SUCCESS("Seed catalog OK."))
