"use client";
import { api } from "./api";

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
};

export async function registerPro(payload: RegisterPayload) {
  const { data } = await api.post("/api/auth/register/", payload);
  return data as { user_id: number; phone: string; message: string };
}

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

export async function resendOtp(payload: { phone: string }) {
  const { data } = await api.post("/api/auth/resend-otp/", payload);
  return data as { detail: string; expires_at: string };
}
