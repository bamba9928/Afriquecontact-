"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { LogOut, User, ImageIcon, Activity, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, logout } = useAuth();

  // État pour s'assurer que le composant est monté (évite les erreurs d'hydratation)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Protection de la route
  useEffect(() => {
    if (isMounted && !accessToken) {
      router.replace("/pro/login");
    }
  }, [accessToken, isMounted, router]);

  // Tant que l'auth n'est pas vérifiée, on affiche un loader ou rien
  if (!isMounted || !accessToken) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <main className="p-6 space-y-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-zinc-400">Gérez votre activité et votre visibilité.</p>
        </div>

        <button
          onClick={() => {
            logout();
            router.replace("/pro/login"); // Redirection explicite après logout
          }}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>

      {/* Grille des widgets */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {/* Widget 1: Statut */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
          <div className="flex items-center gap-3 text-emerald-400 mb-4">
            <Activity size={24} />
            <h3 className="font-semibold text-white">Activité</h3>
          </div>
          <p className="text-sm text-zinc-400">Votre compte est actif et visible sur l'annuaire.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            En ligne
          </div>
        </div>

        {/* Widget 2: Profil (Futur) */}
        <div className="group relative rounded-2xl border border-white/10 bg-zinc-900/50 p-6 hover:bg-zinc-900 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 text-blue-400 mb-4">
            <User size={24} />
            <h3 className="font-semibold text-white">Mon Profil Pro</h3>
          </div>
          <p className="text-sm text-zinc-400">Modifiez vos informations, horaires et contacts.</p>
          <span className="absolute bottom-6 right-6 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Modifier &rarr;
          </span>
        </div>

        {/* Widget 3: Galerie (Futur) */}
        <div className="group relative rounded-2xl border border-white/10 bg-zinc-900/50 p-6 hover:bg-zinc-900 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 text-purple-400 mb-4">
            <ImageIcon size={24} />
            <h3 className="font-semibold text-white">Ma Galerie</h3>
          </div>
          <p className="text-sm text-zinc-400">Ajoutez des photos de vos réalisations.</p>
          <span className="absolute bottom-6 right-6 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Gérer &rarr;
          </span>
        </div>

      </div>
    </main>
  );
}