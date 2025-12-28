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

// --- 2. Entités de Base (Référentiels) ---

export type Job = {
  id: number;
  // L'API renvoie parfois "nom" (fr) ou "name" (en), on gère les deux
  nom?: string;
  name?: string;
  slug?: string;
};

export type Location = {
  id: number;
  nom?: string;
  name?: string;
  type?: string; // ex: "Region", "Ville", "Quartier"
  parent?: number | null;
};

// --- 3. Entités Métier ---

export type ProPublic = {
  id: number;
  nom_commercial?: string;
  full_name?: string; // Souvent utilisé comme fallback si pas de nom commercial

  // On suppose que l'API renvoie l'objet complet (depth=1)
  // Si l'API renvoie juste l'ID (ex: job: 12), changez en : Job | number
  job?: Job;
  location?: Location;

  photo_url?: string;

  // Contacts
  telephone_appel?: string;
  telephone_whatsapp?: string;

  // Flags & État
  is_premium?: boolean;
  est_en_ligne?: boolean; // Pour le petit point vert
  description?: string;
};

export type Publicite = {
  id: number;
  titre: string;
  fichier_url?: string | null; // Image ou Vidéo
  lien_redirection?: string | null;
  telephone_appel?: string | null;
  telephone_whatsapp?: string | null;
  est_visible?: boolean;
};

// --- 4. User & Billing (Espace Pro) ---

export type BillingStatus = {
  // Gestion de la dette technique API (doublons possibles)
  is_active?: boolean;
  active?: boolean;

  days_left?: number;
  expires_at?: string | null; // Format ISO string "2024-12-31T23:59:59Z"
};

export type Annonce = {
  id: number;
  titre?: string;
  // Utiliser des unions types améliore l'autocomplétion
  type?: "offre" | "demande" | string;
  ville?: string;
  prix?: number | string; // Parfois les prix sont envoyés en string "10000.00"
  est_approuvee?: boolean;
  cree_le?: string; // ISO Date
};