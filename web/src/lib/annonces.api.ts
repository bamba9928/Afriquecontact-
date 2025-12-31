"use client";
import { api } from "./api";
import { unwrapList } from "./paginate";
import type { Annonce, Paginated } from "./types";

// Type aligné sur le modèle Django (annonces/models.py)
export type CreateAnnoncePayload = {
  titre: string;
  type: "OFFRE" | "DEMANDE";
  categorie: number; // ID de la catégorie
  zone_geographique: number; // ID de la zone (Location)
  adresse_precise?: string;
  description: string;
  telephone: string;
};

export type UpdateAnnoncePayload = Partial<CreateAnnoncePayload>;

// --- LECTURE ---

// Liste publique avec filtres (ex: ?zone_geographique=5&type=OFFRE)
export async function listAnnonces(filters?: Record<string, string | number>): Promise<Paginated<Annonce>> {
  const { data } = await api.get("/api/annonces/", { params: filters });

  // Gestion robuste si le backend renvoie une liste directe ou une pagination
  if (Array.isArray(data)) {
      return { results: data, count: data.length, next: null, previous: null };
  }
  return data;
}

// Mes annonces (Authentifié)
export async function mesAnnonces(): Promise<Annonce[]> {
  const { data } = await api.get("/api/annonces/mes-annonces/");
  return unwrapList<Annonce>(data);
}

// Détail d'une annonce
export async function getAnnonceDetail(id: number): Promise<Annonce> {
  const { data } = await api.get(`/api/annonces/${id}/`);
  return data;
}

// --- ÉCRITURE (CRUD) ---

export async function creerAnnonce(payload: CreateAnnoncePayload): Promise<Annonce> {
  // Par défaut en REST : POST /api/annonces/
  const { data } = await api.post("/api/annonces/creer/", payload);
  return data;
}

export async function updateAnnonce(id: number, payload: UpdateAnnoncePayload): Promise<Annonce> {
  const { data } = await api.patch(`/api/annonces/${id}/`, payload);
  return data;
}

export async function deleteAnnonce(id: number): Promise<void> {
  await api.delete(`/api/annonces/${id}/`);
}