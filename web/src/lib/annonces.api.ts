"use client";
import { api } from "./api";
import { unwrapList } from "./paginate";
import type { Annonce } from "./types";

// Type pour la création (on force certains champs obligatoires)
export type CreateAnnoncePayload = {
  titre: string;
  type: "offre" | "demande";
  categorie_id?: number; // ou slug
  description?: string;
  prix?: number;
  ville?: string;
  // Si l'upload d'image se fait via un autre endpoint, pas besoin de fichier ici
};

// --- LECTURE ---

// Ajout du support des filtres (ex: ?ville=Dakar&type=offre)
export async function listAnnonces(filters?: Record<string, string | number>): Promise<Annonce[]> {
  const { data } = await api.get("/api/annonces/", { params: filters });
  return unwrapList<Annonce>(data);
}

export async function mesAnnonces(): Promise<Annonce[]> {
  const { data } = await api.get("/api/annonces/mes-annonces/");
  return unwrapList<Annonce>(data);
}

export async function getAnnonceDetail(id: number): Promise<Annonce> {
  const { data } = await api.get(`/api/annonces/${id}/`);
  return data;
}

// --- ÉCRITURE (CRUD) ---

export async function creerAnnonce(payload: CreateAnnoncePayload): Promise<Annonce> {
  const { data } = await api.post("/api/annonces/creer/", payload);
  return data;
}

export async function updateAnnonce(id: number, payload: Partial<CreateAnnoncePayload>): Promise<Annonce> {
  // Django Rest Framework utilise souvent PATCH pour les modifs partielles
  // L'URL dépend de votre urls.py, souvent : /api/annonces/{id}/ ou /api/annonces/{id}/update/
  const { data } = await api.patch(`/api/annonces/${id}/`, payload);
  return data;
}

export async function deleteAnnonce(id: number): Promise<void> {
  await api.delete(`/api/annonces/${id}/`);
}