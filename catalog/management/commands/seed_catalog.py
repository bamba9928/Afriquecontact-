from __future__ import annotations

from collections import defaultdict
from typing import Any

from django.core.management.base import BaseCommand
from django.db import transaction
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
    help = (
        "Seed catalog complet : 14 régions du Sénégal + catégories/métiers "
        "(inclut transport, auto, beauté, artisanat) + featured par slug."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Exécute le seed dans une transaction rollback (aucune écriture persistée).",
        )

    def handle(self, *args: Any, **options: Any):
        dry_run: bool = bool(options.get("dry_run"))
        stats = defaultdict(int)

        # Comparaison featured par slug (robuste aux accents/variantes)
        featured_names = [
            "Coiffeur",
            "Mécanicien",
            "Ménagère",
            "Nounou",
            "Livreur",
            "Soudeur",
            "Chauffeur",
            "Plombier",
            "Maçon",
            "Tailleur",
        ]
        featured_slugs = {slugify(name) for name in featured_names}

        # 1) Localisations
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

        # 2) Catalog métiers (avec ajouts)
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
            },
            # ✅ AJOUTS DEMANDÉS
            "Transport et Logistique": {
                "Conduite": ["Chauffeur", "Chauffeur poids lourd", "Conducteur de moto-taxi"],
                "Livraison": ["Livreur", "Coursier"],
                "Entrepôt": ["Magasinier", "Manutentionnaire"],
            },
            "Automobile et Mécanique": {
                "Réparation": ["Mécanicien", "Mécanicien moto", "Carrossier", "Vulcanisateur"],
                "Électricité": ["Électricien auto"],
                "Maintenance": ["Technicien de maintenance", "Diagnostic automobile"],
            },
            "Beauté et Bien-être": {
                "Coiffure": ["Coiffeur", "Coiffeuse", "Barbier"],
                "Esthétique": ["Esthéticienne", "Maquilleur", "Manucure/Pédicure"],
                "Bien-être": ["Masseur", "Coach sportif"],
            },
            "Artisanat": {
                "Métaux": ["Soudeur", "Ferronnier"],
                "Bois": ["Menuisier", "Charpentier"],
                "Textile": ["Tailleur", "Couturier"],
                "Bâtiment": ["Électricien bâtiment", "Carreleur", "Peintre"],
            },
        }

        # Exécuter dans une transaction + rollback si dry-run
        with transaction.atomic():
            # 1. PAYS
            senegal, created = Location.objects.get_or_create(
                type=Location.Type.COUNTRY,
                parent=None,
                name="Sénégal",
                defaults={"slug": "senegal"},
            )
            stats["country_created"] += int(created)
            stats["country_existing"] += int(not created)

            # 2. RÉGIONS + VILLES
            for reg_name, cities in locations_data.items():
                region, created_region = Location.objects.get_or_create(
                    type=Location.Type.REGION,
                    parent=senegal,
                    name=reg_name,
                    defaults={"slug": unique_slug(Location, f"{reg_name}-region")},
                )
                stats["regions_created"] += int(created_region)
                stats["regions_existing"] += int(not created_region)

                for city_name in cities:
                    _, created_city = Location.objects.get_or_create(
                        type=Location.Type.CITY,
                        parent=region,
                        name=city_name,
                        defaults={"slug": unique_slug(Location, f"{city_name}-{reg_name}")},
                    )
                    stats["cities_created"] += int(created_city)
                    stats["cities_existing"] += int(not created_city)

            # 3. CATÉGORIES + MÉTIERS
            for cat_name, subcats in catalog_data.items():
                parent_cat, created_parent = JobCategory.objects.get_or_create(
                    name=cat_name,
                    parent=None,
                    defaults={"slug": unique_slug(JobCategory, cat_name)},
                )
                stats["categories_created"] += int(created_parent)
                stats["categories_existing"] += int(not created_parent)

                for subcat_name, jobs in subcats.items():
                    sub_cat, created_sub = JobCategory.objects.get_or_create(
                        name=subcat_name,
                        parent=parent_cat,
                        defaults={"slug": unique_slug(JobCategory, f"{subcat_name}-{cat_name}")},
                    )
                    stats["subcategories_created"] += int(created_sub)
                    stats["subcategories_existing"] += int(not created_sub)

                    for job_name in jobs:
                        is_feat = slugify(job_name) in featured_slugs

                        job, created_job = Job.objects.get_or_create(
                            category=sub_cat,
                            name=job_name,
                            defaults={
                                "slug": unique_slug(Job, f"{job_name}-{subcat_name}"),
                                "is_featured": is_feat,
                            },
                        )
                        stats["jobs_created"] += int(created_job)
                        stats["jobs_existing"] += int(not created_job)

                        # Idempotence : met à jour is_featured si besoin
                        if (not created_job) and (job.is_featured != is_feat):
                            job.is_featured = is_feat
                            job.save(update_fields=["is_featured"])
                            stats["jobs_featured_updated"] += 1

            # Dry-run => rollback volontaire
            if dry_run:
                transaction.set_rollback(True)

        # Résumé
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY-RUN activé : aucune donnée n'a été persistée (rollback)."))

        self.stdout.write(self.style.SUCCESS("Seed catalog terminé."))
        self.stdout.write(
            "\n".join(
                [
                    f"- Country: created={stats['country_created']} existing={stats['country_existing']}",
                    f"- Regions: created={stats['regions_created']} existing={stats['regions_existing']}",
                    f"- Cities:  created={stats['cities_created']} existing={stats['cities_existing']}",
                    f"- Categories(parent): created={stats['categories_created']} existing={stats['categories_existing']}",
                    f"- Subcategories:      created={stats['subcategories_created']} existing={stats['subcategories_existing']}",
                    f"- Jobs:    created={stats['jobs_created']} existing={stats['jobs_existing']}",
                    f"- Jobs featured updated={stats['jobs_featured_updated']}",
                ]
            )
        )
