"use client";

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/auth.store";

// On s'assure que l'URL ne finit pas par un slash pour éviter les doubles //
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// --- 1. INTERCEPTEUR DE REQUÊTE (Injection Token) ---
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Variables pour la gestion du Refresh (File d'attente) ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

// --- 2. INTERCEPTEUR DE RÉPONSE (Gestion 401 & Refresh) ---
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as any;

    // Si l'erreur n'a pas de réponse (ex: réseau coupé), on rejette direct
    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;

    // Détection des routes d'auth pour éviter les boucles infinies
    const url = String(originalRequest?.url || "");

    const isAuthRoute = url.includes("login") || url.includes("refresh");

    // Si ce n'est pas une 401, ou si on a déjà tenté de retry, ou si c'est une route auth
    if (status !== 401 || originalRequest._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Si un refresh est déjà en cours, on met cette requête en attente
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject: (err) => reject(err),
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Appel direct avec axios "nu" pour éviter de passer par les intercepteurs de 'api'
      const response = await axios.post(
        `${baseURL}/api/auth/token/refresh/`,
        { refresh: refreshToken }
      );

      const { access, refresh } = response.data;

      // Mise à jour du store
      // Si le back ne renvoie pas de nouveau refresh, on garde l'ancien
      useAuthStore.getState().setTokens(access, refresh || refreshToken);

      // On traite la file d'attente
      processQueue(null, access);

      // On relance la requête initiale
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return api(originalRequest);

    } catch (refreshError) {
      // Si le refresh échoue (ex: refresh token expiré), on déconnecte l'utilisateur
      processQueue(refreshError, null);
      useAuthStore.getState().logout();

      // Optionnel : Rediriger vers login via window.location si nécessaire
      // window.location.href = '/pro/login';

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);