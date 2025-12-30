"use client";

import { api } from "./api";

// --- TYPES ---

export type Job = {
  id: number;
  name: string;
  slug?: string;
  category: number; // ID de la sous-catégorie
  is_featured?: boolean;
};

// Structure hiérarchique des Catégories
export type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  subcategories: CategoryNode[]; // Enfants
};

export type LocationType = "COUNTRY" | "REGION" | "DEPARTMENT" | "CITY" | "DISTRICT";

// Structure hiérarchique des Lieux (Pays -> Région -> Département -> Quartier)
export type LocationNode = {
  id: number;
  name: string;
  slug: string;
  type: LocationType;
  children: LocationNode[];
};

// --- API CALLS ---

// 1. Récupérer tous les jobs (pour filtrer localement)
export async function getAllJobs(): Promise<Job[]> {
  const { data } = await api.get("/api/catalog/jobs/", { params: { page_size: 1000 } });
  return (data.results || data) as Job[];
}

// 1bis. Récupérer les jobs mis en avant (featured)
export async function getFeaturedJobs(): Promise<Job[]> {
  const { data } = await api.get("/api/catalog/jobs/featured/");
  return (data.results || data) as Job[];
}

// 2. Récupérer l'arbre des catégories (Parent -> Sub)
export async function getCategoriesTree(): Promise<CategoryNode[]> {
  const { data } = await api.get("/api/catalog/categories/tree/");
  return data as CategoryNode[];
}

// 3. Récupérer l'arbre géographique (Pays -> Régions -> Départements -> Quartiers)
// On renvoie une liste de régions (avec leurs enfants).
export async function getLocationsTree(): Promise<LocationNode[]> {
  const { data } = await api.get("/api/catalog/locations/tree/");

  // Le backend peut renvoyer le PAYS en racine ou une liste directe
  const root = Array.isArray(data) ? data : [data];

  const regions: LocationNode[] = [];

  const findRegions = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (node?.type === "REGION") {
        regions.push(node as LocationNode);
      } else if (node?.children?.length) {
        findRegions(node.children);
      }
    });
  };

  findRegions(root);
  return regions.sort((a, b) => a.name.localeCompare(b.name));
}
