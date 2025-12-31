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
  parent: number | null;
  subcategories: CategoryNode[];
};

export type LocationType = "COUNTRY" | "REGION" | "DEPARTMENT" | "CITY" | "DISTRICT";

// Structure hiérarchique des Lieux (Région -> Département/Ville -> Quartier)
export type LocationNode = {
  id: number;
  name: string;
  slug: string;
  type: LocationType;
  children: LocationNode[];
  // Champs additionnels éventuels renvoyés par le backend (non bloquants)
  parent?: number | null;
  type_display?: string;
};

// --- HELPERS ---

function asList<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data.results)) return data.results as T[];
  return [];
}

/**
 * Normalise un nœud de localisation en garantissant la structure attendue
 */
function normalizeLocationNode(node: any): LocationNode | null {
  if (!node || typeof node !== "object") return null;

  return {
    id: node.id,
    name: node.name || "",
    slug: node.slug || "",
    type: node.type as LocationType,
    children: Array.isArray(node.children)
      ? node.children.map(normalizeLocationNode).filter(Boolean) as LocationNode[]
      : [],
    parent: node.parent ?? null,
    type_display: node.type_display,
  };
}

// --- API CALLS ---

// 1) Jobs
export async function getAllJobs(): Promise<Job[]> {
  try {
    const { data } = await api.get("/api/catalog/jobs/", {
      params: { page_size: 1000 }
    });
    return asList<Job>(data);
  } catch (error) {
    console.error("Erreur lors du chargement des métiers:", error);
    return [];
  }
}

export async function getFeaturedJobs(): Promise<Job[]> {
  try {
    const { data } = await api.get("/api/catalog/jobs/featured/");
    return asList<Job>(data);
  } catch (error) {
    console.error("Erreur lors du chargement des métiers vedettes:", error);
    return [];
  }
}

// 2) Catégories (tree)
export async function getCategoriesTree(): Promise<CategoryNode[]> {
  try {
    const { data } = await api.get("/api/catalog/categories/tree/");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Erreur lors du chargement des catégories:", error);
    return [];
  }
}

// 3) Localisations (tree) : retourne une liste de REGIONS avec leur hiérarchie complète
export async function getLocationsTree(): Promise<LocationNode[]> {
  try {
    const { data } = await api.get("/api/catalog/locations/tree/");

    // Normalisation : data peut être un objet racine ou directement un tableau
    const root: any[] = Array.isArray(data) ? data : [data];

    const regions: LocationNode[] = [];
    const seenIds = new Set<number>();

    /**
     * Parcours récursif pour extraire toutes les régions
     * avec leur hiérarchie complète (Départements -> Villes -> Quartiers)
     */
    const extractRegions = (nodes: any[]) => {
      for (const node of nodes ?? []) {
        if (!node) continue;

        // On ne garde que les nœuds de type REGION
        if (node.type === "REGION") {
          if (!seenIds.has(node.id)) {
            const normalized = normalizeLocationNode(node);
            if (normalized) {
              regions.push(normalized);
              seenIds.add(node.id);
            }
          }
        }

        // Parcours récursif des enfants
        if (Array.isArray(node.children) && node.children.length > 0) {
          extractRegions(node.children);
        }
      }
    };

    extractRegions(root);

    // Tri alphabétique des régions
    return regions.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  } catch (error) {
    console.error("Erreur lors du chargement de l'arbre des localisations:", error);
    return [];
  }
}

// 4) Localisations (liste plate) - avec filtre optionnel par type
export async function getLocations(params?: {
  type?: LocationType;
  parent?: number;
  page_size?: number;
}): Promise<LocationNode[]> {
  try {
    const { data } = await api.get("/api/catalog/locations/", {
      params: {
        page_size: 1000,
        ...(params ?? {}),
      },
    });

    const list = asList<any>(data);

    // Normalisation avec garantie children: []
    return list
      .map(normalizeLocationNode)
      .filter(Boolean) as LocationNode[];
  } catch (error) {
    console.error("Erreur lors du chargement des localisations:", error);
    return [];
  }
}

/**
 * Utilitaire : Trouver une région par ID dans l'arbre
 */
export function findRegionById(
  tree: LocationNode[],
  regionId: number
): LocationNode | undefined {
  return tree.find((r) => r.id === regionId);
}

/**
 * Utilitaire : Trouver un département dans une région
 */
export function findDepartmentInRegion(
  region: LocationNode,
  departmentId: number
): LocationNode | undefined {
  return region.children?.find((d) => d.id === departmentId && d.type === "DEPARTMENT");
}

/**
 * Utilitaire : Extraire tous les départements d'une région
 */
export function getDepartmentsFromRegion(region: LocationNode): LocationNode[] {
  return (region.children ?? []).filter((child) => child.type === "DEPARTMENT");
}

/**
 * Utilitaire : Extraire tous les quartiers d'un département
 */
export function getDistrictsFromDepartment(department: LocationNode): LocationNode[] {
  // Les quartiers sont sous CITY, qui est sous DEPARTMENT
  const cities = (department.children ?? []).filter((child) => child.type === "CITY");

  const districts: LocationNode[] = [];
  for (const city of cities) {
    districts.push(...(city.children ?? []).filter((child) => child.type === "DISTRICT"));
  }

  return districts;
}

/**
 * Utilitaire : Recherche d'une localisation par ID (recherche récursive)
 */
export function findLocationById(
  tree: LocationNode[],
  locationId: number
): LocationNode | undefined {
  for (const node of tree) {
    if (node.id === locationId) return node;

    if (node.children && node.children.length > 0) {
      const found = findLocationById(node.children, locationId);
      if (found) return found;
    }
  }

  return undefined;
}

/**
 * Utilitaire : Obtenir le chemin complet d'une localisation (breadcrumb)
 * Retourne : [Région, Département, Ville, Quartier]
 */
export function getLocationPath(
  tree: LocationNode[],
  locationId: number
): LocationNode[] {
  const path: LocationNode[] = [];

  const search = (nodes: LocationNode[], targetId: number): boolean => {
    for (const node of nodes) {
      if (node.id === targetId) {
        path.unshift(node);
        return true;
      }

      if (node.children && node.children.length > 0) {
        if (search(node.children, targetId)) {
          path.unshift(node);
          return true;
        }
      }
    }
    return false;
  };

  search(tree, locationId);
  return path;
}

/**
 * Utilitaire : Vérifier si un département contient des quartiers
 */
export function departmentHasDistricts(department: LocationNode): boolean {
  if (!department.children || department.children.length === 0) return false;

  for (const city of department.children) {
    if (city.type === "CITY" && city.children && city.children.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Utilitaire : Compter le nombre total de quartiers dans une région
 */
export function countDistrictsInRegion(region: LocationNode): number {
  let count = 0;

  for (const dept of region.children ?? []) {
    if (dept.type === "DEPARTMENT") {
      count += getDistrictsFromDepartment(dept).length;
    }
  }

  return count;
}