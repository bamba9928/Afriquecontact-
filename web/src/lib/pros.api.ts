"use client";
import { api } from "./api";
import type { ProPublic, Paginated } from "./types";

// --- TYPES ---

export type FavoriItem = {
  id: number;
  professionnel: number;
  professionnel_details: ProPublic;
  cree_le: string;
};

// Type complet pour le profil privé (édition)
export type ProPrivate = {
  id: number;
  user: number;
  nom_entreprise: string;
  slug: string;
  description: string;
  telephone_appel: string;
  telephone_whatsapp: string;
  // IDs pour les relations en édition
  metier: number;
  zone_geographique: number;
  // Statuts
  statut_en_ligne: "ONLINE" | "OFFLINE";
  est_publie: boolean;
  whatsapp_verifie: boolean;
  avatar: string | null;
  medias: Array<{
    id: number;
    fichier: string;
    type_media: "PHOTO" | "VIDEO" | "CV";
  }>;
};

export type ProsSearchParams = {
  metier?: number;
  zone_geographique?: number;
  search?: string;
  statut_en_ligne?: "ONLINE" | "OFFLINE";
  lat?: number;
  lng?: number;
  radius_km?: number;
  sort?: "distance";
  page?: number;
  page_size?: number;
};

// --- RECHERCHE PUBLIQUE ---

export async function rechercherPros(params: ProsSearchParams): Promise<Paginated<ProPublic>> {
  const { data } = await api.get("/api/pros/recherche/", { params });
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }
  return data as Paginated<ProPublic>;
}

export async function getProPublicDetails(id: number): Promise<ProPublic> {
  // Récupère le détail public (sans infos sensibles)
  const { data } = await api.get(`/api/pros/recherche/${id}/`);
  return data;
}

// --- GESTION DU PROFIL (ME) ---

export async function getProMe(): Promise<ProPrivate> {
  const { data } = await api.get("/api/pros/me/");
  return data;
}

export async function patchProMe(payload: Partial<ProPrivate>): Promise<ProPrivate> {
  const { data } = await api.patch("/api/pros/me/", payload);
  return data;
}

export async function publierMe(): Promise<ProPrivate> {
  const { data } = await api.post("/api/pros/me/publier/");
  return data;
}

export async function masquerMe(): Promise<ProPrivate> {
  const { data } = await api.post("/api/pros/me/masquer/");
  return data;
}

export async function uploadMeMedia(payload: { file: File; type_media: "PHOTO" | "VIDEO" | "CV" }) {
  const fd = new FormData();
  fd.append("fichier", payload.file);
  fd.append("type_media", payload.type_media);

  // Endpoint dédié aux médias du pro connecté
  const { data } = await api.post("/api/pros/media/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// --- FAVORIS ---

export async function listFavoris(params?: { page?: number; page_size?: number }): Promise<Paginated<FavoriItem>> {
  const { data } = await api.get("/api/pros/favoris/", { params });
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }
  return data as Paginated<FavoriItem>;
}

export async function addFavori(proId: number) {
  const { data } = await api.post("/api/pros/favoris/", { professionnel: proId });
  return data as FavoriItem;
}

export async function removeFavori(proId: number) {
  // L'URL attend l'ID du PROFESSIONNEL, pas l'ID de l'objet favori (selon votre backend)
  await api.delete(`/api/pros/favoris/${proId}/`);
}