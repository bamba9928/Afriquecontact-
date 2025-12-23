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
        catalog_data = {
            "Bâtiment et Travaux Publics": {
                "Gros Œuvre": ["Maçon", "Ferrailleur", "Coffreur"],
                "Second Œuvre": ["Peintre", "Carreleur", "Plombier", "Électricien"],
                "Menuiserie": ["Menuisier bois", "Menuisier alu", "Charpentier"],
            },
            "Services à la Personne": {
                "Maison": ["Ménagère", "Jardinier", "Gardien"],
                "Famille": ["Nounou", "Aide à domicile"],
                "Beauté": ["Coiffeur", "Coiffeuse", "Esthéticienne", "Tailleur"],
            },
            "Transport et Logistique": {
                "Transport": ["Chauffeur", "Livreur"],
                "Mécanique": ["Mécanicien", "Électricien auto", "Vulcanisateur"],
            },
            "Numérique": {
                "Développement": ["Développeur web", "Développeur mobile"],
                "Marketing": ["Community manager", "Infographe"],
            }
        }

        featured_jobs = ["Coiffeur", "Mécanicien", "Ménagère", "Livreur", "Plombier", "Maçon"]

        for cat_name, subcats in catalog_data.items():
            # Créer/Récupérer la catégorie parente
            parent_cat, _ = JobCategory.objects.get_or_create(
                name=cat_name,
                parent=None,
                defaults={"slug": unique_slug(JobCategory, cat_name)},
            )

            for subcat_name, job_names in subcats.items():
                # Créer/Récupérer la sous-catégorie
                sub_cat, _ = JobCategory.objects.get_or_create(
                    name=subcat_name,
                    parent=parent_cat,
                    defaults={"slug": unique_slug(JobCategory, f"{cat_name}-{subcat_name}")},
                )

                for job_name in job_names:
                    desired_featured = job_name in featured_jobs

                    # Fix B : Slug stable basé sur la sous-catégorie
                    job_slug = unique_slug(Job, f"{job_name}-{sub_cat.slug}")

                    job, created = Job.objects.get_or_create(
                        category=sub_cat,
                        name=job_name,
                        defaults={
                            "slug": job_slug,
                            "is_featured": desired_featured,
                        },
                    )

                    # Fix A : Update si déjà existant
                    if not created and job.is_featured != desired_featured:
                        job.is_featured = desired_featured
                        job.save(update_fields=["is_featured"])

        self.stdout.write(self.style.SUCCESS("Seed catalog avec sous-catégories terminé !"))
