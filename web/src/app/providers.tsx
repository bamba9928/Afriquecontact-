"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function Providers({ children }: { children: React.ReactNode }) {
  // 1. Création du client en mode "Singleton" pour éviter de réinitialiser le cache
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Avec le SSR, on définit un staleTime pour éviter le refetch immédiat
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (

    <QueryClientProvider client={queryClient}>
      {children}

      {/* Outils de debug (s'affichent uniquement en mode dev) */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}