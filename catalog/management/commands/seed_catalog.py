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
            "Tendances / Métiers les plus recherchés": [
                "Coiffeur",
                "Coiffeuse",
                "Mécanicien",
                "Ménagère",
                "Nounou",
                "Livreur",
                "Soudeur",
                "Chauffeur",
                "Menuisier bois",
                "Menuisier alu",
                "Carreleur",
                "Technicien",
                "Gardien",
                "Peintre",
                "Plombier",
                "Tailleur",
                "Bijoutier",
                "Informaticien",
                "Tapissier",
                "Infographe",
                "Traiteur",
                "Sérigraphe",
                "Boulanger",
                "Comptable",
                "Décorateur",
                "Cordonnier",
                "Sculpteur",
                "Photographe",
            ],
            "Numérique et Technologies de l'Information (TIC)": [
                "Développement web",
                "Data analyste",
                "Spécialiste en cybersécurité",
                "Community manager",
                "Technicien en réseaux",
            ],
            "Énergies Renouvelables et Économie Verte": [
                "Ingénieur en énergie solaire ou éolienne",
                "Technicien de maintenance de systèmes solaires",
                "Spécialiste en gestion durable",
                "Expert en climat",
            ],
            "Agrobusiness et Agro-industrie": [
                "Ingénieur agronome",
                "Technicien de production",
                "Responsable qualité",
                "Spécialiste du marketing agroalimentaire",
                "Spécialiste en gestion de la chaîne d'approvisionnement agricole",
            ],
            "BTP (Bâtiment et Travaux Publics) et Urbanisme": [
                "Ingénieur civil",
                "Architecte",
                "Urbaniste",
                "Technicien en construction",
            ],
            "E-commerce et Logistique": [
                "Logisticien",
                "Spécialiste en chaîne d'approvisionnement (Supply Chain)",
                "Responsable de plateformes marchandes",
                "Livreur professionnel",
            ],
            "Santé et Bien-être": [
                "Médecin",
                "Infirmier",
                "Pharmacien",
                "Technicien biomédical",
                "Chercheur en santé publique",
            ],
            "Immobilier et Parking": [
                "Agent immobilier",
                "Gérant de parking automobile",
            ],
            "Gestion, Finance et Juridique": [
                "Comptable",
                "Auditeur",
                "Contrôleur de gestion",
                "Responsable RH",
                "Responsable conformité",
                "Juriste d'entreprise",
                "Gestionnaire de portefeuille",
            ],
            "Commercial et Marketing": [
                "Commercial/Vendeur terrain",
                "Attaché commercial",
                "Responsable marketing digital",
                "Téléconseiller",
                "Responsable service clients",
            ],
            "Technique et Industriel": [
                "Technicien de maintenance mécanique",
                "Technicien en électricité",
                "Ingénieur de production",
            ],
            "Hôtellerie, Tourisme et Restauration": [
                "Gestionnaire d'hôtel",
                "Spécialiste du marketing touristique",
                "Chef de cuisine",
                "Guide touristique",
            ],
            "Éducation et Formation": [
                "Formateur spécialisé mécanique",
                "Formateur informatique",
                "Formateur entrepreneuriat",
                "Professeur (secondaire ou universitaire)",
            ],
        }

        featured = {
            "Coiffeur",
            "Mécanicien",
            "Ménagère",
            "Nounou",
            "Livreur",
            "Soudeur",
            "Chauffeur",
            "Menuisier bois",
            "Menuisier alu",
            "Coiffeuse",
            "Carreleur",
            "Technicien",
            "Gardien",
            "Peintre",
            "Plombier",
            "Tailleur",
            "Bijoutier",
            "Informaticien",
            "Tapissier",
            "Infographe",
            "Traiteur",
            "Sérigraphe",
            "Boulanger",
            "Comptable",
            "Décorateur",
            "Cordonnier",
            "Sculpteur",
            "Photographe",
        }

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
