// src/lib/types.ts

// --- 1. Utilitaires Génériques ---

/**
 * Structure standard de pagination Django Rest Framework (PageNumberPagination)
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
// Alias raccourci souvent utilisé
export type Paginated<T> = PaginatedResponse<T>;


// --- 2. Entités de Base (Référentiels) ---

export type Job = {
  id: number;
  nom?: string;
  name?: string; // Le backend DRF renvoie souvent 'name' par défaut
  slug?: string;
};

export type Location = {
  id: number;
  nom?: string;
  name?: string;
  type?: string;
  parent?: number | null;
};


// --- 3. Entités Métier (Profils) ---

/**
 * Correspond exactement à ProPublicSerializer côté Django
 */
export type ProPublic = {
  id: number;
  slug: string;
  nom_entreprise: string; // Backend: nom_entreprise (pas nom_commercial)

  // Champs aplatis (read_only) provenant du serializer
  metier_name: string;
  zone_name: string;

  description?: string;

  // Contacts (peuvent être null si is_contactable est false)
  telephone_appel?: string | null;
  telephone_whatsapp?: string | null;
  is_contactable: boolean; // Calculé par le backend (paiement ok ou propriétaire)

  avatar?: string | null;
  photo_couverture?: string | null; // Calculé par le backend (Média principal)

  statut_en_ligne: "ONLINE" | "OFFLINE"; // Enum strict

  latitude?: number | string | null;
  longitude?: number | string | null;
  note_moyenne?: number | string;

  // Champ calculé optionnel ajouté par la vue "Recherche" si lat/lng fournis
  distance_km?: number;
};

/**
 * Correspond à ContactFavoriSerializer
 */
export type FavoriItem = {
  id: number;
  professionnel: number; // ID du pro
  professionnel_details: ProPublic; // Objet pro complet imbriqué
  cree_le: string;
};


// --- 4. Publicité & Annonces ---

export type Publicite = {
  id: number;
  titre: string;
  fichier_url?: string | null;
  lien_redirection?: string | null;
  telephone_appel?: string | null;
  telephone_whatsapp?: string | null;
  est_visible?: boolean;
};

export type Annonce = {
  id: number;
  titre?: string;
  type?: "offre" | "demande" | string;
  ville?: string;
  prix?: number | string;
  est_approuvee?: boolean;
  cree_le?: string;
};


// --- 5. User & Billing (Espace Pro) ---

export type BillingMe = {
  // Supporte les deux formats au cas où le serializer évolue
  is_active?: boolean;
  active?: boolean;

  days_left?: number;
  expires_at?: string | null; // ISO Date
};

// Type étendu pour le profil privé (ProMeSerializer)
// Ce serializer renvoie des objets imbriqués complets pour l'édition
export type ProPrivate = ProPublic & {
  telephone_utilisateur?: string;
  whatsapp_verifie?: boolean;
  metier?: number; // ID pour l'édition
  metier_details?: Job;
  zone_geographique?: number; // ID pour l'édition
  zone_details?: Location;
  billing?: BillingMe;
};