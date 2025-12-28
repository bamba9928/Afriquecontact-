"use client";
import { api } from "./api";
import type { BillingMe } from "./types";

// Récupérer l'état de l'abonnement
export async function billingMe(): Promise<BillingMe> {
  const { data } = await api.get("/api/billing/me/");
  return data;
}

// Initialiser le paiement
// On ajoute un paramètre optionnel 'plan' (ex: 'monthly' ou 'yearly')
export async function billingCheckout(planKey?: string): Promise<{ checkout_url: string }> {
  // Si backend gère plusieurs offres, il attendra probablement { plan: 'yearly' }
  const payload = planKey ? { plan: planKey } : {};

  const { data } = await api.post("/api/billing/checkout/", payload);
  return data;
}

// Optionnel : Gestion du Portail Client (si on utilise Stripe pour annuler/changer de CB)
export async function billingPortal(): Promise<{ portal_url: string }> {
  const { data } = await api.post("/api/billing/portal/");
  return data;
}