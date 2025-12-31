// web/src/lib/types.ts

import type { Job, Location } from "./catalog.api";

// --- 1. Utilitaires Génériques ---

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// --- 2. Profils Professionnels ---
// Aligné sur Django (MediaProSerializer / ProPublicListSerializer / ProPublicSerializer / ProMeSerializer)

export type ProMedia = {
  id: number;
  type_media: "PHOTO" | "VIDEO" | "CV";
  fichier: string;
  est_principal: boolean;
  cree_le: string; // ISO datetime
};

export type ProPublicBase = {
  id: number;
  slug: string;
  nom_entreprise: string;

  metier_name: string;
  zone_name: string;

  description: string;
  avatar: string | null;

  telephone_appel: string | null;
  telephone_whatsapp: string | null;
  is_contactable: boolean;

  statut_en_ligne: "ONLINE" | "OFFLINE";
  whatsapp_verifie: boolean;

  latitude: number | null;
  longitude: number | null;
  note_moyenne: number | null;

  // annoté uniquement si lat/lng fournis côté API
  distance_km?: number | null;

  photo_couverture: string | null;
};

// LIST (RechercheProView) : pas de galerie complète
export type ProPublicList = ProPublicBase;

// DETAIL (ProPublicDetailView) : galerie complète
export type ProPublicDetail = ProPublicBase & {
  medias: ProMedia[];
};

// Favoris: si backend renvoie ProPublicListSerializer dans professionnel_details
export type FavoriItem = {
  id: number;
  professionnel: number;
  professionnel_details: ProPublicList;
  cree_le: string;
};

// /me (ProMeSerializer) : structure privée d’édition
export type ProMe = {
  id: number;
  telephone_utilisateur: string;
  whatsapp_verifie: boolean;

  nom_entreprise: string;

  metier: number;
  metier_details: Job;

  zone_geographique: number;
  zone_details: Location;

  zones_intervention: number[];
  intervention_details: Location[];

  description: string;
  telephone_appel: string;
  telephone_whatsapp: string;

  avatar: string | null;
  statut_en_ligne: "ONLINE" | "OFFLINE";
  est_publie: boolean;

  latitude: number | null;
  longitude: number | null;

  note_moyenne: number | null;
  nombre_avis: number;

  cree_le: string;
  mis_a_jour_le: string;
};

// --- 3. Annonces (Offres & Demandes) ---

export type AnnonceType = "OFFRE" | "DEMANDE";

export type Annonce = {
  id: number;
  titre: string;
  slug: string;
  type: AnnonceType;

  description: string;
  adresse_precise: string;
  telephone: string;

  // IDs (écriture)
  categorie: number;
  zone_geographique: number;

  // Objets détaillés (lecture, read_only)
  categorie_details?: Job;
  zone_details?: Location;

  // Méta-données
  auteur_phone?: string;
  est_mon_annonce: boolean;
  est_approuvee: boolean;
  nb_vues: number;
  cree_le: string;
};

export type AnnoncePayload = {
  type: AnnonceType;
  titre: string;
  description: string;
  zone_geographique: number;
  adresse_precise: string;
  telephone: string;
  categorie: number;
};

// --- 4. Publicités (Ads) ---

export type Publicite = {
  id: number;
  titre: string;
  fichier_url: string;
  lien_redirection?: string | null;
  telephone_appel?: string | null;
  telephone_whatsapp?: string | null;
  est_visible: boolean;
  date_fin?: string;
};

// --- 5. Billing (Abonnements) ---

export type PaymentInfo = {
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  paid_at?: string;
};

export type BillingMe = {
  status: string;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  days_left: number;
  last_payment?: PaymentInfo | null;
};
