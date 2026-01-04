import axios from "axios";

// --- CONFIGURATION ISOMORPHE (Serveur & Client) ---
// On recrée une instance simple qui ne dépend pas du store d'auth (Zustand)
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

const publicApi = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// --- TYPES ---

export type Job = {
  id: number;
  name: string;
  slug?: string;
  category: number;
  is_featured?: boolean;
};

export type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  subcategories: CategoryNode[];
};

export type LocationType = "COUNTRY" | "REGION" | "DEPARTMENT" | "CITY" | "DISTRICT" | "COMMUNE";

export type LocationNode = {
  id: number;
  name: string;
  slug: string;
  type: LocationType;
  children: LocationNode[];
  parent?: number | null;
  type_display?: string;
};

// --- HELPERS ---

function asList<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data.results)) return data.results as T[];
  return [];
}

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
    const { data } = await publicApi.get("/api/catalog/jobs/", {
      params: { page_size: 1000 }
    });
    return asList<Job>(data);
  } catch (error) {
    console.error("Erreur lors du chargement des métiers:", error);
    return [];
  }
}

/**
 * ✅ AJOUT : Récupère un job spécifique via son slug ou son nom.
 * Utilisé pour les pages SEO /metiers/[slug]
 */
export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  // Idéalement, le backend devrait avoir un endpoint /api/catalog/jobs/{slug}/
  // En attendant, on filtre côté client pour économiser une route backend spécifique
  const jobs = await getAllJobs();
  const normalizedSlug = slug.toLowerCase();

  return jobs.find((j) =>
    (j.slug && j.slug === normalizedSlug) ||
    j.name.toLowerCase() === normalizedSlug ||
    // Gestion basique des espaces remplacés par des tirets
    j.name.toLowerCase().replace(/\s+/g, "-") === normalizedSlug
  );
}

export async function getFeaturedJobs(): Promise<Job[]> {
  try {
    const { data } = await publicApi.get("/api/catalog/jobs/featured/");
    return asList<Job>(data);
  } catch (error) {
    console.error("Erreur lors du chargement des métiers vedettes:", error);
    return [];
  }
}

// 2) Catégories (tree)
export async function getCategoriesTree(): Promise<CategoryNode[]> {
  try {
    const { data } = await publicApi.get("/api/catalog/categories/tree/");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Erreur lors du chargement des catégories:", error);
    return [];
  }
}

// 3) Localisations (tree)
export async function getLocationsTree(): Promise<LocationNode[]> {
  try {
    const { data } = await publicApi.get("/api/catalog/locations/tree/", {
      params: { page_size: 10000 }
    });

    let rawList: any[] = [];
    if (Array.isArray(data)) {
        rawList = data;
    } else if (data && Array.isArray(data.results)) {
        rawList = data.results;
    } else {
        rawList = [data];
    }

    const regions: LocationNode[] = [];
    const seenIds = new Set<number>();

    const extractRegions = (nodes: any[]) => {
      for (const node of nodes ?? []) {
        if (!node) continue;
        if (node.type === "REGION") {
          if (!seenIds.has(node.id)) {
            const normalized = normalizeLocationNode(node);
            if (normalized) {
              regions.push(normalized);
              seenIds.add(node.id);
            }
          }
        }
        if (Array.isArray(node.children) && node.children.length > 0) {
          extractRegions(node.children);
        }
      }
    };

    extractRegions(rawList);
    return regions.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  } catch (error) {
    console.error("Erreur lors du chargement de l'arbre des localisations:", error);
    return [];
  }
}

// 4) Localisations (liste plate)
export async function getLocations(params?: {
  type?: LocationType;
  parent?: number;
  page_size?: number;
}): Promise<LocationNode[]> {
  try {
    const { data } = await publicApi.get("/api/catalog/locations/", {
      params: {
        page_size: 1000,
        ...(params ?? {}),
      },
    });

    const list = asList<any>(data);
    return list.map(normalizeLocationNode).filter(Boolean) as LocationNode[];
  } catch (error) {
    console.error("Erreur lors du chargement des localisations:", error);
    return [];
  }
}

// --- UTILS (Inchangés) ---

export function findRegionById(tree: LocationNode[], regionId: number): LocationNode | undefined {
  return tree.find((r) => r.id === regionId);
}

export function findDepartmentInRegion(region: LocationNode, departmentId: number): LocationNode | undefined {
  return region.children?.find((d) => d.id === departmentId && d.type === "DEPARTMENT");
}

export function getDepartmentsFromRegion(region: LocationNode): LocationNode[] {
  return (region.children ?? []).filter((child) => child.type === "DEPARTMENT");
}

export function getDistrictsFromDepartment(department: LocationNode): LocationNode[] {
  const directDistricts = (department.children ?? []).filter((c) => c.type === "DISTRICT");
  const nestedDistricts: LocationNode[] = [];
  const subNodes = (department.children ?? []).filter((c) => c.type === "CITY" || c.type === "COMMUNE");

  for (const node of subNodes) {
      if(node.children) {
          nestedDistricts.push(...node.children.filter((c) => c.type === "DISTRICT"));
      }
  }
  return [...directDistricts, ...nestedDistricts];
}

export function findLocationById(tree: LocationNode[], locationId: number): LocationNode | undefined {
  for (const node of tree) {
    if (node.id === locationId) return node;
    if (node.children && node.children.length > 0) {
      const found = findLocationById(node.children, locationId);
      if (found) return found;
    }
  }
  return undefined;
}

export function getLocationPath(tree: LocationNode[], locationId: number): LocationNode[] {
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

export function departmentHasDistricts(department: LocationNode): boolean {
    const districts = getDistrictsFromDepartment(department);
    return districts.length > 0;
}

export function countDistrictsInRegion(region: LocationNode): number {
  let count = 0;
  for (const dept of region.children ?? []) {
    if (dept.type === "DEPARTMENT") {
      count += getDistrictsFromDepartment(dept).length;
    }
  }
  return count;
}