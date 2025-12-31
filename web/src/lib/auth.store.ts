"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Interface utilisateur minimale stockée en local
export interface User {
  id: number;
  phone: string;
  nom_entreprise?: string;
  avatar?: string;
  // On ajoute d'autres champs si nécessaire
}

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null; // Ajouté pour un accès rapide aux infos (ex: nom dans le header)

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      // Mise à jour des tokens uniquement
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),

      // Mise à jour de l'utilisateur (après un /auth/me par exemple)
      setUser: (user) =>
        set({ user }),

      // Déconnexion complète
      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        // Optionnel : Forcer le nettoyage du storage
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
        }
      },
    }),
    {
      name: "auth-storage", // Clé unique dans le localStorage
      // Gestion sécurisée du storage pour éviter les erreurs SSR (Server Side Rendering)
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : undefined)),
      // skipHydration: true, // On décommente si nous avons des erreurs d'hydratation "Text content does not match"
    }
  )
);