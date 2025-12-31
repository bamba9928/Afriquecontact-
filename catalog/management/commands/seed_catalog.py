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


        try:
            from .data.quartiers_mapping import QUARTIERS_PAR_VILLE
        except ImportError:
            self.stdout.write(self.style.WARNING(
                "⚠️  Fichier quartiers_mapping.py non trouvé. "
                "Création des quartiers génériques uniquement."
            ))
            # Fallback: quartiers génériques
            QUARTIERS_PAR_VILLE = {}

        # Quartiers génériques si aucun mapping spécifique
        quartiers_generiques = [
            "Centre-ville", "Médina", "Escale", "Quartier résidentiel",
            "Zone commerciale", "Quartier administratif"
        ]

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

                # 1) CITY sous le DEPARTMENT
                city, _ = Location.objects.get_or_create(
                    type=Location.Type.CITY,
                    parent=dep,
                    name=dep_name,
                    defaults={"slug": unique_slug(Location, f"{dep_name}-{reg_name}-ville")},
                )

                # 2) DISTRICT (Quartier) sous la CITY - MAPPING SPÉCIFIQUE
                quartiers_ville = QUARTIERS_PAR_VILLE.get(dep_name, quartiers_generiques)

                for q in quartiers_ville:
                    Location.objects.get_or_create(
                        type=Location.Type.DISTRICT,
                        parent=city,
                        name=q,
                        defaults={"slug": unique_slug(Location, f"{q}-{dep_name}")},
                    )

                if quartiers_ville == quartiers_generiques:
                    self.stdout.write(
                        f"  ℹ️  {dep_name}: {len(quartiers_ville)} quartiers génériques créés"
                    )

        # 3. MÉTIERS ET CATÉGORIES DU CAHIER DES CHARGES
        catalog_data = {
            "Numérique et Technologies de l'Information (TIC)": {
                "Développement & Data": [
                    "Développement web",
                    "Data analyste",
                    "Développeur mobile",
                    "Ingénieur DevOps",
                    "Data scientist",
                ],
                "Réseaux, Cybersécurité & Social": [
                    "Spécialiste en cybersécurité",
                    "Technicien en réseaux",
                    "Community manager",
                    "Administrateur systèmes",
                    "Analyste SOC",
                    "Spécialiste SEO/SEA",
                ],
            },

            "Énergies Renouvelables et Économie Verte": {
                "Ingénierie & Maintenance": [
                    "Ingénieur en énergie solaire ou éolienne",
                    "Technicien de maintenance de systèmes solaires",
                    "Ingénieur en efficacité énergétique",
                    "Technicien en biomasse",
                ],
                "Gestion durable & Climat": [
                    "Spécialiste en gestion durable",
                    "Expert en climat",
                    "Conseiller en transition énergétique",
                    "Analyste carbone",
                ],
            },

            "Agrobusiness et Agro-industrie": {
                "Production agricole": [
                    "Ingénieur agronome",
                    "Technicien de production",
                    "Agriculteur spécialisé en cultures bio",
                    "Technicien en irrigation",
                ],
                "Qualité, Marketing & Supply": [
                    "Responsable qualité",
                    "Spécialiste du marketing agroalimentaire",
                    "Spécialiste en gestion de la chaîne d'approvisionnement agricole",
                    "Responsable export agroalimentaire",
                    "Analyste qualité",
                ],
            },

            "BTP (Bâtiment et Travaux Publics) et Urbanisme": {
                "Conception": [
                    "Ingénieur civil",
                    "Architecte",
                    "Dessinateur-projeteur",
                    "Ingénieur en génie hydraulique",
                ],
                "Terrain & Chantier": [
                    "Urbaniste",
                    "Technicien en construction",
                    "Conducteur de travaux",
                    "Géomètre-topographe",
                ],
            },

            "E-commerce et Logistique": {
                "Supply Chain": [
                    "Logisticien",
                    "Spécialiste en chaîne d'approvisionnement (Supply Chain)",
                    "Responsable entrepôt",
                    "Planificateur logistique",
                ],
                "Plateformes & Livraison": [
                    "Responsable de plateformes marchandes",
                    "Livreur professionnel",
                    "Gestionnaire marketplace",
                    "Responsable transport",
                ],
            },

            "Santé et Bien-être": {
                "Soins": [
                    "Médecin",
                    "Infirmier",
                    "Pharmacien",
                    "Sage-femme",
                    "Kinésithérapeute",
                    "Psychologue",
                ],
                "Technique & Recherche": [
                    "Technicien biomédical",
                    "Chercheur en santé publique",
                    "Bio-informaticien",
                    "Technicien de laboratoire",
                ],
            },

            "Immobilier et Parking": {
                "Immobilier": [
                    "Agent immobilier",
                    "Promoteur immobilier",
                    "Expert en évaluation foncière",
                ],
                "Parking": [
                    "Gérant de parking Automobile",
                    "Responsable sécurité parking",
                    "Gestionnaire mobilité urbaine",
                ],
            },

            "Gestion, Finance et Juridique": {
                "Comptabilité & Contrôle": [
                    "Comptable",
                    "Auditeur",
                    "Contrôleur de gestion",
                    "Expert-comptable",
                    "Analyste financier",
                ],
                "RH, Conformité & Juridique": [
                    "Responsable RH (Ressources Humaines)",
                    "Responsable conformité",
                    "Juriste d'entreprise",
                    "Gestionnaire de portefeuille",
                    "Responsable paie",
                    "Avocat d'affaires",
                ],
            },

            "Commercial et Marketing": {
                "Vente": [
                    "Commercial/Vendeur terrain",
                    "Attaché commercial",
                    "Ingénieur commercial",
                    "Responsable grands comptes",
                ],
                "Marketing & Service client": [
                    "Responsable marketing digital",
                    "Téléconseiller",
                    "Responsable service clients",
                    "Spécialiste CRM",
                    "Responsable communication",
                ],
            },

            "Technique et Industriel": {
                "Maintenance": [
                    "Technicien de maintenance mécanique",
                    "Technicien en électricité",
                    "Technicien en automatisme",
                    "Électromécanicien",
                ],
                "Production": [
                    "Ingénieur de production",
                    "Ingénieur procédés",
                    "Responsable production industrielle",
                ],
            },

            "Hôtellerie, Tourisme et Restauration": {
                "Gestion & Marketing touristique": [
                    "Gestionnaire d'hôtel",
                    "Spécialiste du marketing Touristique",
                    "Responsable événementiel",
                    "Agent de voyages",
                ],
                "Cuisine & Guidage": [
                    "Chef de cuisine",
                    "Guide touristique",
                    "Pâtissier",
                    "Sommelier",
                ],
            },

            "Éducation et Formation": {
                "Formation": [
                    "Formateur spécialisé mécanique",
                    "Formateur informatique",
                    "Formateur en langues",
                    "Formateur en gestion de projet",
                ],
                "Enseignement": [
                    "Formateur entrepreneuriat",
                    "Professeur (secondaire ou universitaire)",
                    "Enseignant en sciences",
                    "Professeur d'arts appliqués",
                ],
            },

            # NOUVELLE CATÉGORIE AJOUTÉE
            "Artisanat & Services": {
                "Coiffure & Beauté": [
                    "Coiffeur",
                    "Coiffeuse",
                    "Esthéticien(ne)",
                    "Barbier",
                ],
                "Menuiserie": [
                    "Menuisier bois",
                    "Menuisier alu",
                    "Ébéniste",
                    "Charpentier",
                ],
                "BTP & Finitions": [
                    "Carreleur",
                    "Peintre",
                    "Maçon",
                    "Plâtrier",
                ],
                "Plomberie & Soudure": [
                    "Plombier",
                    "Soudeur",
                    "Chauffagiste",
                    "Monteur en installations sanitaires",
                ],
                "Textile & Ameublement": [
                    "Tailleur",
                    "Tapissier",
                    "Couturier",
                    "Designer textile",
                ],
                "Artisanat d'art": [
                    "Bijoutier",
                    "Sculpteur",
                    "Céramiste",
                    "Graveur",
                ],
                "Impression & Design": [
                    "Infographe",
                    "Sérigraphe",
                    "Designer graphique",
                    "Illustrateur",
                ],
                "Alimentation & Traiteur": [
                    "Boulanger",
                    "Traiteur",
                    "Pâtissier",
                    "Chocolatier",
                ],
                "Transport & Livraison": [
                    "Chauffeur",
                    "Livreur",
                    "Conducteur poids lourds",
                    "Taxi-moto",
                ],
                "Entretien & Garde à domicile": [
                    "Ménagère",
                    "Nounou",
                    "Agent d'entretien",
                    "Auxiliaire de vie",
                ],
                "Sécurité & Assistance": [
                    "Gardien",
                    "Technicien",
                    "Agent de sécurité incendie",
                    "Vigile",
                ],
                "Décoration & Média": [
                    "Décorateur",
                    "Photographe",
                    "Vidéaste",
                    "Designer d'intérieur",
                ],
                "Informatique & Comptabilité": [
                    "Informaticien",
                    "Comptable",
                    "Analyste programmeur",
                    "Assistant comptable",
                ],
                "Réparation": [
                    "Cordonnier",
                    "Mécanicien",
                    "Réparateur électroménager",
                    "Carrossier",
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
            "Livreur professionnel",
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

        self.stdout.write(self.style.SUCCESS("✅ Seed catalog complet terminé avec succès !"))
        self.stdout.write(self.style.SUCCESS(f"✅ Total métiers en vedette : {len(featured_list)}"))