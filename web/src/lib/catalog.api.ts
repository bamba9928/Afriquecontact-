"use client";

import { api } from "./api";
import { unwrapList } from "./paginate";
import type { Job, Location } from "./types";

// --- Types Avancés ---

// Permet de typer l'arbre des localités (Région -> Ville -> Quartier)
export type LocationTree = Location & {
  children?: LocationTree[];
};

// --- API Calls ---

export async function getFeaturedJobs(): Promise<Job[]> {
  const { data } = await api.get("/api/catalog/jobs/featured/");
  return unwrapList<Job>(data);
}

// Ajout du paramètre "search" (optionnel) pour filtrer côté serveur
export async function getAllJobs(search?: string): Promise<Job[]> {
  const params = search ? { search } : {};
  const { data } = await api.get("/api/catalog/jobs/", { params });
  return unwrapList<Job>(data);
}

// Ajout du paramètre "parent" ou "search" pour les localités
export async function getLocations(params?: { search?: string; parent?: number }): Promise<Location[]> {
  const { data } = await api.get("/api/catalog/locations/", { params });
  return unwrapList<Location>(data);
}

// Typage strict de l'arbre (plus de 'any')
export async function getLocationsTree(): Promise<LocationTree[]> {
  const { data } = await api.get("/api/catalog/locations/tree/");
  // Les endpoints 'tree' renvoient souvent une liste directe des racines,
  // mais on utilise unwrapList par sécurité si jamais c'est paginé.
  return unwrapList<LocationTree>(data);
}