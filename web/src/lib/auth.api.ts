"use client";
import { api } from "./api";

// --- Types ---

export type RegisterPayload = {
  phone: string;
  password: string;
  nom_entreprise: string;
  metier_id: number;
  zone_id: number;
  telephone_appel: string;
  telephone_whatsapp: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
};

export type LoginPayload = {
  phone: string;
  password: string;
};

export type AuthResponse = {
  access: string;
  refresh: string;
};

// --- Fonctions API ---

// 1. Inscription
export async function registerPro(payload: RegisterPayload) {
  const { data } = await api.post("/api/auth/register/", payload);
  return data as { user_id: number; phone: string; message: string };
}

// 2. Connexion (Ajoutée pour corriger votre erreur)
export async function login(payload: LoginPayload) {
  // Correspond à TokenObtainPairView dans accounts/urls.py
  const { data } = await api.post("/api/auth/login/", payload);
  return data as AuthResponse;
}

// 3. Vérification WhatsApp
export async function verifyWhatsapp(payload: { phone: string; code: string }) {
  const { data } = await api.post("/api/auth/verify-whatsapp/", payload);
  return data as {
    detail: string;
    user_id: number;
    phone: string;
    whatsapp_verified: boolean;
    access: string;
    refresh: string;
  };
}

// 4. Renvoyer OTP
export async function resendOtp(payload: { phone: string }) {
  const { data } = await api.post("/api/auth/resend-otp/", payload);
  return data as { detail: string; expires_at: string };
}