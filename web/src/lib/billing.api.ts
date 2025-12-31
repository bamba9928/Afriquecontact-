"use client";
import { api } from "./api";
// le type BillingMe est bien défini dans ./types.ts
// export interface BillingMe { is_active: boolean; days_left: number; end_at?: string; ... }
import type { BillingMe } from "./types";

/**
 * Récupère l'état actuel de l'abonnement du professionnel connecté.
 * Endpoint: GET /api/billing/me/
 */
export async function billingMe(): Promise<BillingMe> {
  const { data } = await api.get("/api/billing/me/");
  return data;
}

/**
 * Initialise le paiement pour l'abonnement (1000 FCFA par défaut).
 * Endpoint: POST /api/billing/checkout/
 * Retourne l'URL de paiement Bictorys.
 */
export async function billingCheckout(amount?: number): Promise<{ checkout_url: string }> {
  // Le backend utilise une valeur par défaut (1000), mais on peut la surcharger si besoin.
  const payload = amount ? { amount } : {};

  const { data } = await api.post("/api/billing/checkout/", payload);
  return data;
}