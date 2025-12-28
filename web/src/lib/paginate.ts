import { Paginated } from "./types";

/**
 * Extrait une liste d'objets, que l'API renvoie un tableau direct ou une réponse paginée DRF.
 * Gère aussi les cas null/undefined pour éviter les crashs.
 */
export function unwrapList<T>(data: T[] | Paginated<T> | null | undefined): T[] {
  // 1. Sécurité : si l'API n'a rien renvoyé ou une erreur
  if (!data) return [];

  // 2. Cas tableau direct (pagination désactivée)
  if (Array.isArray(data)) return data;

  // 3. Cas réponse paginée (DRF standard)
  return data.results ?? [];
}