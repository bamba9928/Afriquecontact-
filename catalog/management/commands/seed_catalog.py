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
    help = "Seed catalog complet : 14 régions du Sénégal + catégories professionnelles du cahier des charges"

    def handle(self, *args, **options):
        # 1. PAYS
        senegal, _ = Location.objects.get_or_create(
            type=Location.Type.COUNTRY,
            parent=None,
            name="Sénégal",
            defaults={"slug": "senegal"},
        )

        # 2. LES 14 RÉGIONS ET VILLES PRINCIPALES
        locations_data = {
            "Dakar": ["Dakar Plateau", "Pikine", "Guédiawaye", "Rufisque", "Keur Massar"],
            "Thiès": ["Thiès Ville", "Mbour", "Saly", "Tivaouane", "Joal-Fadiouth"],
            "Diourbel": ["Touba", "Mbacké", "Diourbel Ville"],
            "Saint-Louis": ["Saint-Louis Ville", "Richard-Toll", "Dagana", "Podor"],
            "Ziguinchor": ["Ziguinchor Ville", "Bignona", "Oussouye", "Cap Skirring"],
            "Kaolack": ["Kaolack Ville", "Nioro du Rip", "Guinguinéo"],
            "Louga": ["Louga Ville", "Linguère", "Kébémer"],
            "Fatick": ["Fatick Ville", "Foundiougne", "Gossas"],
            "Kolda": ["Kolda Ville", "Vélingara"],
            "Matam": ["Matam Ville", "Ourossogui", "Kanel"],
            "Kaffrine": ["Kaffrine Ville", "Koungheul"],
            "Tambacounda": ["Tambacounda Ville", "Bakel"],
            "Kédougou": ["Kédougou Ville", "Salémata"],
            "Sédhiou": ["Sédhiou Ville", "Goudomp"],
        }

        for reg_name, cities in locations_data.items():
            region, _ = Location.objects.get_or_create(
                type=Location.Type.REGION,
                parent=senegal,
                name=reg_name,
                defaults={"slug": unique_slug(Location, f"{reg_name}-region")},
            )
            for city_name in cities:
                Location.objects.get_or_create(
                    type=Location.Type.CITY,
                    parent=region,
                    name=city_name,
                    defaults={"slug": unique_slug(Location, f"{city_name}-{reg_name}")},
                )

        # 3. MÉTIERS ET CATÉGORIES DU CAHIER DES CHARGES
        catalog_data = {
            "Numérique et TIC": {
                "Développement": ["Développement web", "Data analyste"],
                "Infrastructure": ["Spécialiste en cybersécurité", "Technicien en réseaux"],
                "Marketing Digital": ["Community manager"],
            },
            "Énergies et Environnement": {
                "Solaire": ["Ingénieur en énergie solaire", "Technicien de maintenance solaire"],
                "Expertise": ["Spécialiste en gestion durable", "Expert en climat"],
            },
            "Agrobusiness": {
                "Production": ["Ingénieur agronome", "Technicien de production"],
                "Qualité et Logistique": ["Responsable qualité", "Spécialiste supply chain agricole"],
            },
            "BTP et Urbanisme": {
                "Conception": ["Architecte", "Urbaniste", "Ingénieur civil"],
                "Chantier": ["Technicien en construction", "Maçon", "Ferrailleur", "Peintre", "Plombier"],
            },
            "Santé et Bien-être": {
                "Médical": ["Médecin", "Infirmier", "Pharmacien"],
                "Technique": ["Technicien biomédical", "Chercheur en santé publique"],
            },
            "Services de Maison": {
                "Entretien": ["Ménagère", "Jardinier", "Gardien"],
                "Famille": ["Nounou", "Aide à domicile"],
            },
            "Hôtellerie et Tourisme": {
                "Gestion": ["Gestionnaire d'hôtel", "Chef de cuisine"],
                "Services": ["Guide touristique", "Spécialiste marketing touristique"],
            }
        }

        # Liste des métiers "Les plus recherchés" pour le flag is_featured
        featured_list = [
            "Coiffeur", "Mécanicien", "Ménagère", "Nounou", "Livreur",
            "Soudeur", "Chauffeur", "Plombier", "Maçon", "Tailleur"
        ]

        for cat_name, subcats in catalog_data.items():
            parent_cat, _ = JobCategory.objects.get_or_create(
                name=cat_name,
                parent=None,
                defaults={"slug": unique_slug(JobCategory, cat_name)},
            )

            for subcat_name, jobs in subcats.items():
                sub_cat, _ = JobCategory.objects.get_or_create(
                    name=subcat_name,
                    parent=parent_cat,
                    defaults={"slug": unique_slug(JobCategory, f"{subcat_name}-{cat_name}")},
                )

                for job_name in jobs:
                    is_feat = job_name in featured_list
                    job, created = Job.objects.get_or_create(
                        category=sub_cat,
                        name=job_name,
                        defaults={
                            "slug": unique_slug(Job, f"{job_name}-{subcat_name}"),
                            "is_featured": is_feat
                        },
                    )
                    # Mise à jour si le métier existe déjà pour garantir l'idempotence
                    if not created and job.is_featured != is_feat:
                        job.is_featured = is_feat
                        job.save(update_fields=["is_featured"])

        self.stdout.write(self.style.SUCCESS("Seed catalog complet terminé avec succès !"))