import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { setAuthToken } from "./api"; // Assurez-vous d'importer votre fonction api.ts

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string | null, refresh: string | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 1. État initial toujours null pour éviter l'erreur d'hydratation
      accessToken: null,
      refreshToken: null,

      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh });
        // 2. On met à jour Axios immédiatement
        setAuthToken(access);
      },

      logout: () => {
        set({ accessToken: null, refreshToken: null });
        // 3. On nettoie Axios
        setAuthToken(null);
      },
    }),
    {
      name: "sc_auth_storage", // Nom de la clé unique dans localStorage
      storage: createJSONStorage(() => localStorage), // Définition explicite du stockage

      // 4. MAGIE : S'exécute au démarrage quand le navigateur relit le localStorage
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setAuthToken(state.accessToken);
          console.log("🔄 Session restaurée et Axios configuré");
        }
      },
    }
  )
);