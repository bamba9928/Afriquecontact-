"use client";

import type { Paginated } from "./types";

/**
 * Extrait une liste d'objets (T[]), que l'API renvoie un tableau direct ou une réponse paginée DRF.
 * Utile quand on veut juste itérer sur les items sans se soucier du nombre total de pages.
 * * @example
 * const items = unwrapList(response); // Retourne toujours T[]
 */
export function unwrapList<T>(data: T[] | Paginated<T> | null | undefined): T[] {
  // 1. Sécurité : si l'API n'a rien renvoyé ou une erreur
  if (!data) return [];

  // 2. Cas tableau direct (pagination désactivée côté backend)
  if (Array.isArray(data)) return data;

  // 3. Cas réponse paginée (DRF standard avec clé 'results')
  return data.results ?? [];
}

/**
 * Normalise une réponse API en format Paginé (Paginated<T>).
 * Si l'API renvoie un tableau simple, on le transforme en objet paginé fictif.
 * Utile pour les composants (comme InfiniteScroll ou Table) qui attendent strictement { count, results... }.
 * * @example
 * const page = ensurePaginated(response); // Retourne toujours { count: N, results: [...] }
 */
export function ensurePaginated<T>(data: T[] | Paginated<T> | null | undefined): Paginated<T> {
  // 1. Cas vide / erreur
  if (!data) {
    return { count: 0, next: null, previous: null, results: [] };
  }

  // 2. Cas tableau direct : on simule une page unique
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data
    };
  }

  // 3. C'est déjà une réponse paginée valide, on la retourne telle quelle
  // On ajoute une sécurité sur results au cas où le backend renverrait un objet partiel
  return {
    ...data,
    results: data.results ?? []
  };
}