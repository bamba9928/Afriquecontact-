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

        # 2) RÉGIONS -> DÉPARTEMENTS (46)
        regions_departements = {
            "Dakar": ["Dakar", "Pikine", "Rufisque", "Guédiawaye", "Keur Massar"],
            "Ziguinchor": ["Bignona", "Oussouye", "Ziguinchor"],
            "Diourbel": ["Bambey", "Diourbel", "Mbacké"],
            "Saint-Louis": ["Dagana", "Podor", "Saint-Louis"],
            "Tambacounda": ["Bakel", "Tambacounda", "Goudiry", "Koumpentoum"],
            "Kaolack": ["Kaolack", "Nioro du Rip", "Guinguinéo"],
            "Thiès": ["M'bour", "Thiès", "Tivaouane"],
            "Louga": ["Kébémer", "Linguère", "Louga"],
            "Fatick": ["Fatick", "Foundiougne", "Gossas"],
            "Kolda": ["Kolda", "Vélingara", "Médina Yoro Foulah"],
            "Matam": ["Kanel", "Matam", "Ranérou-Ferlo"],
            "Kaffrine": ["Kaffrine", "Birkelane", "Koungheul", "Malem-Hodar"],
            "Kédougou": ["Kédougou", "Salémata", "Saraya"],
            "Sédhiou": ["Sédhiou", "Bounkiling", "Goudomp"],
        }

        # 2 quartiers "par défaut" par département (tu pourras remplacer par des vrais quartiers ensuite)
        default_quartiers = ["Centre-ville", "Zone périphérique"]

        for reg_name, deps in regions_departements.items():
            region, _ = Location.objects.get_or_create(
                type=Location.Type.REGION,
                parent=senegal,
                name=reg_name,
                defaults={"slug": unique_slug(Location, f"{reg_name}-region")},
            )

            for dep_name in deps:
                dep, _ = Location.objects.get_or_create(
                    type=Location.Type.DEPARTMENT,
                    parent=region,
                    name=dep_name,
                    defaults={"slug": unique_slug(Location, f"{dep_name}-{reg_name}-departement")},
                )

                for q in default_quartiers:
                    Location.objects.get_or_create(
                        type=Location.Type.DISTRICT,
                        parent=dep,
                        name=q,
                        defaults={"slug": unique_slug(Location, f"{q}-{dep_name}")},
                    )

        # 3. MÉTIERS ET CATÉGORIES DU CAHIER DES CHARGES
        catalog_data = {
            "Numérique et Technologies de l'Information (TIC)": {
                "Développement & Data": [
                    "Développement web",
                    "Data analyste",
                ],
                "Réseaux, Cybersécurité & Social": [
                    "Spécialiste en cybersécurité",
                    "Technicien en réseaux",
                    "Community manager",
                ],
            },

            "Énergies Renouvelables et Économie Verte": {
                "Ingénierie & Maintenance": [
                    "Ingénieur en énergie solaire ou éolienne",
                    "Technicien de maintenance de systèmes solaires",
                ],
                "Gestion durable & Climat": [
                    "Spécialiste en gestion durable",
                    "Expert en climat",
                ],
            },

            "Agrobusiness et Agro-industrie": {
                "Production agricole": [
                    "Ingénieur agronome",
                    "Technicien de production",
                ],
                "Qualité, Marketing & Supply": [
                    "Responsable qualité",
                    "Spécialiste du marketing agroalimentaire",
                    "Spécialiste en gestion de la chaîne d'approvisionnement agricole",
                ],
            },

            "BTP (Bâtiment et Travaux Publics) et Urbanisme": {
                "Conception": [
                    "Ingénieur civil",
                    "Architecte",
                ],
                "Terrain & Chantier": [
                    "Urbaniste",
                    "Technicien en construction",
                ],
            },

            "E-commerce et Logistique": {
                "Supply Chain": [
                    "Logisticien",
                    "Spécialiste en chaîne d'approvisionnement (Supply Chain)",
                ],
                "Plateformes & Livraison": [
                    "Responsable de plateformes marchandes",
                    "Livreur professionnel",
                ],
            },

            "Santé et Bien-être": {
                "Soins": [
                    "Médecin",
                    "Infirmier",
                    "Pharmacien",
                ],
                "Technique & Recherche": [
                    "Technicien biomédical",
                    "Chercheur en santé publique",
                ],
            },

            "Immobilier et Parking": {
                "Immobilier": [
                    "Agent immobilier",
                ],
                "Parking": [
                    "Gérant de parking Automobile",
                ],
            },

            "Gestion, Finance et Juridique": {
                "Comptabilité & Contrôle": [
                    "Comptable",
                    "Auditeur",
                    "Contrôleur de gestion",
                ],
                "RH, Conformité & Juridique": [
                    "Responsable RH (Ressources Humaines)",
                    "Responsable conformité",
                    "Juriste d'entreprise",
                    "Gestionnaire de portefeuille",
                ],
            },

            "Commercial et Marketing": {
                "Vente": [
                    "Commercial/Vendeur terrain",
                    "Attaché commercial",
                ],
                "Marketing & Service client": [
                    "Responsable marketing digital",
                    "Téléconseiller",
                    "Responsable service clients",
                ],
            },

            "Technique et Industriel": {
                "Maintenance": [
                    "Technicien de maintenance mécanique",
                    "Technicien en électricité",
                ],
                "Production": [
                    "Ingénieur de production",
                ],
            },

            "Hôtellerie, Tourisme et Restauration": {
                "Gestion & Marketing touristique": [
                    "Gestionnaire d'hôtel",
                    "Spécialiste du marketing Touristique",
                ],
                "Cuisine & Guidage": [
                    "Chef de cuisine",
                    "Guide touristique",
                ],
            },

            "Éducation et Formation": {
                "Formation": [
                    "Formateur spécialisé mécanique",
                    "Formateur informatique",
                ],
                "Enseignement": [
                    "Formateur entrepreneuriat",
                    "Professeur (secondaire ou universitaire)",
                ],
            },

            # NOUVELLE CATÉGORIE AJOUTÉE
            "Artisanat & Services": {
                "Coiffure & Beauté": [
                    "Coiffeur",
                    "Coiffeuse",
                ],
                "Menuiserie": [
                    "Menuisier bois",
                    "Menuisier alu",
                ],
                "BTP & Finitions": [
                    "Carreleur",
                    "Peintre",
                ],
                "Plomberie & Soudure": [
                    "Plombier",
                    "Soudeur",
                ],
                "Textile & Ameublement": [
                    "Tailleur",
                    "Tapissier",
                ],
                "Artisanat d'art": [
                    "Bijoutier",
                    "Sculpteur",
                ],
                "Impression & Design": [
                    "Infographe",
                    "Sérigraphe",
                ],
                "Alimentation & Traiteur": [
                    "Boulanger",
                    "Traiteur",
                ],
                "Transport & Livraison": [
                    "Chauffeur",
                    "Livreur",
                ],
                "Entretien & Garde à domicile": [
                    "Ménagère",
                    "Nounou",
                ],
                "Sécurité & Assistance": [
                    "Gardien",
                    "Technicien",
                ],
                "Décoration & Média": [
                    "Décorateur",
                    "Photographe",
                ],
                "Informatique & Comptabilité": [
                    "Informaticien",
                    "Comptable",
                ],
                "Réparation": [
                    "Cordonnier",
                    "Mécanicien",
                ],
            },
        }

        # Liste des métiers en vedette (featured) - sans doublons
        extra_featured = [
            "Coiffeur", "Coiffeuse",
            "Mécanicien",
            "Ménagère",
            "Nounou",
            "Livreur",
            "Soudeur",
            "Chauffeur",
            "Menuisier bois", "Menuisier alu",
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
            "Livreur professionnel",  # Déjà présent dans E-commerce
        ]

        featured_list = sorted(set([
            "Développement web",
            "Data analyste",
            "Infirmier",
            "Comptable",
            "Commercial/Vendeur terrain",
            "Agent immobilier",
            "Logisticien",
        ] + extra_featured))

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
        self.stdout.write(self.style.SUCCESS(f"Total métiers en vedette : {len(featured_list)}"))