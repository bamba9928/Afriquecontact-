"use client";
import { api } from "./api";
import { unwrapList } from "./paginate";
import type { Publicite } from "./types";

// 1. Récupérer les publicités actives
export async function getAds(): Promise<Publicite[]> {
  // Appelle PubliciteListView (GET /api/ads/)
  const { data } = await api.get("/api/ads/");
  return unwrapList<Publicite>(data);
}

// 2. Enregistrer un clic sur une pub
export async function trackAdClick(adId: number): Promise<void> {
  // ATTENTION : Cet endpoint nécessite une vue dédiée côté Django (ex: PubliciteClickView)
  // Actuellement, ads/urls.py ne définit pas de route ".../click/".
  // On capture l'erreur pour ne pas interrompre la navigation de l'utilisateur.
  try {
    await api.post(`/api/ads/${adId}/click/`);
  } catch (err) {
    // On log en warn plutôt qu'en error pour ne pas polluer la console inutilement
    console.warn(`Tracking pub ${adId} échoué (Endpoint backend non disponible)`);
  }
}