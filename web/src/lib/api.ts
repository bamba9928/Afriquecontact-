"use client";

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "./auth.store"; // Assurez-vous que le chemin est bon

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// --- 1. INTERCEPTEUR DE REQUÊTE (Injection Token) ---
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // On récupère le token directement du store Zustand à chaque requête
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Variables pour la gestion du Refresh ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- 2. INTERCEPTEUR DE RÉPONSE (Gestion Erreurs 401) ---
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as any;
    const status = error.response?.status;

    // Détection des routes d'auth pour éviter les boucles infinies
    const url = String(originalRequest?.url || "");
    const isAuthRoute = url.includes("/auth/login/") || url.includes("/auth/token/refresh/");

    // Si ce n'est pas une 401, ou si on a déjà tenté de retry, ou si c'est l'API de login qui foire
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

      // Appel direct avec axios (pas l'instance api) pour éviter l'intercepteur
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/token/refresh/`,
        { refresh: refreshToken }
      );

      const newAccessToken = data.access;
      // Certains backends renvoient un nouveau refresh token, d'autres non.
      // S'il n'y en a pas, on garde l'ancien.
      const newRefreshToken = data.refresh || refreshToken;

      // Mise à jour du store
      useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

      // On relance la file d'attente avec le nouveau token
      processQueue(null, newAccessToken);

      // On relance la requête initiale qui avait échoué
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);

    } catch (refreshError) {
      // Si le refresh échoue (token expiré ou invalide), on déconnecte tout le monde
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);