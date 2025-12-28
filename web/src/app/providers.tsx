"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Outil de débogage indispensable (ne s'affichera pas en build production)
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 🚀 PERFORMANCE CRITIQUE :
            // Par défaut, React Query considère les données comme "périmées" (stale) immédiatement (0ms).
            // Cela signifie qu'à chaque fois que l'utilisateur change de fenêtre et revient,
            // ou change de page, une nouvelle requête part vers Django.

            // On définit ici que les données restent "fraîches" pendant 1 minute.
            staleTime: 60 * 1000,

            // Évite de réessayer 3 fois si l'API renvoie une 404
            retry: 1,

            // Empêche le refetch automatique si on change de focus de fenêtre (optionnel, selon préférence)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* Petit bouton flottant en bas à gauche pour inspecter le cache en mode DEV */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}