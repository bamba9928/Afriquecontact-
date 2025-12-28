"use client";
import { api } from "./api";
import { unwrapList } from "./paginate";
import type { Publicite } from "./types";

// 1. Récupérer les pubs (Votre code actuel)
export async function getAds(): Promise<Publicite[]> {
  const { data } = await api.get("/api/ads/");
  return unwrapList<Publicite>(data);
}

// 2. Enregistrer un clic (Optionnel mais recommandé)
// À appeler lors du onClick sur la bannière
export async function trackAdClick(adId: number): Promise<void> {
  // Vérifiez si votre backend a une route dédiée, souvent : /api/ads/{id}/click/
  // C'est un appel "fire-and-forget" (on n'attend pas forcément la réponse pour rediriger)
  try {
    await api.post(`/api/ads/${adId}/click/`);
  } catch (err) {
    // On ignore silencieusement les erreurs de tracking pour ne pas bloquer l'utilisateur
    console.error("Erreur tracking pub", err);
  }
}