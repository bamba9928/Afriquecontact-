"use client";

import { api } from "./api";
import type { ProPublic, Paginated } from "./types";

// Favoris item (si tu ne l’as pas déjà dans types.ts)
export type FavoriItem = {
  id: number;
  professionnel: number;
  professionnel_details: ProPublic;
  cree_le: string;
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

// ✅ Recherche : Conforme à RechercheProView
export async function rechercherPros(params: ProsSearchParams): Promise<Paginated<ProPublic>> {
  const { data } = await api.get("/api/pros/recherche/", { params });

  // DRF pagination => {count,next,previous,results}
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }
  return data as Paginated<ProPublic>;
}

// --- FAVORIS ---
// GET supporte pagination (si activée côté DRF). On la passe en params.

export async function listFavoris(params?: { page?: number; page_size?: number }): Promise<Paginated<FavoriItem>> {
  const { data } = await api.get("/api/pros/favoris/", { params });

  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }
  return data as Paginated<FavoriItem>;
}

export async function addFavori(proId: number) {
  // Serializer attend le champ "professionnel" (FK)
  const { data } = await api.post("/api/pros/favoris/", { professionnel: proId });
  return data as FavoriItem;
}

export async function removeFavori(proId: number) {
  // URL: /favoris/<int:professionnel_id>/
  await api.delete(`/api/pros/favoris/${proId}/`);
}
