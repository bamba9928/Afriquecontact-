"use client";

import { api } from "./api";
import type { ProPublic, PaginatedResponse } from "./types"; // Assurez-vous d'importer PaginatedResponse
import { unwrapList } from "./paginate";

// Paramètres exacts attendus par RechercheProView
export type ProsSearchParams = {
  metier?: number;            // ID du métier
  zone_geographique?: number; // ID de la zone
  search?: string;            // Recherche textuelle (nom ou description)
  statut_en_ligne?: "ONLINE" | "OFFLINE";
  lat?: number;
  lng?: number;
  radius_km?: number;
  sort?: "distance";          // Active le tri par distance
  page?: number;
  page_size?: number;
};

export async function rechercherPros(params: ProsSearchParams): Promise<PaginatedResponse<ProPublic>> {
  // Appel vers RechercheProView
  const { data } = await api.get<PaginatedResponse<ProPublic>>("/api/pros/recherche/", { params });
  return data;
}


export async function forYouPros(): Promise<ProPublic[]> {
  // On récupère les 10 derniers profils mis à jour (tri par défaut du backend)
  const { data } = await api.get<PaginatedResponse<ProPublic>>("/api/pros/recherche/", {
    params: { page_size: 10 }
  });
  return unwrapList(data);
}