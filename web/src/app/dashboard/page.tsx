"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth.store";
import { getProMe } from "@/lib/pros.api";
import { billingMe } from "@/lib/billing.api";

import {
  LogOut, User, Activity, Loader2, CreditCard,
  Megaphone, ExternalLink, ShieldCheck, AlertTriangle
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();

  // Protection de la route
  useEffect(() => {
    if (!accessToken) {
      router.replace("/pro/login");
    }
  }, [accessToken, router]);

  // Récupération des données Pro & Billing
  const { data: pro, isLoading: proLoading } = useQuery({
    queryKey: ["pro-me"],
    queryFn: getProMe,
    enabled: !!accessToken,
  });

  const { data: billing, isLoading: billingLoading } = useQuery({
    queryKey: ["billing-me"],
    queryFn: billingMe,
    enabled: !!accessToken,
  });

  const isLoading = proLoading || billingLoading;
  const isPremium = !!(billing?.is_active ?? billing?.active);
  const isOnline = pro?.statut_en_ligne === "ONLINE";
  const isVisible = pro?.est_publie;

  if (!accessToken) return null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">

      {/* EN-TÊTE AVEC STATUT GLOBAL */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between rounded-3xl bg-zinc-900/50 p-6 border border-white/10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Bonjour, {pro?.nom_entreprise || "Partenaire"} 👋
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
             {/* Badge Premium */}
             <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isPremium ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-zinc-800 border-white/10 text-zinc-400"}`}>
                {isPremium ? <ShieldCheck size={14}/> : <AlertTriangle size={14}/>}
                {isPremium ? "Compte Premium Actif" : "Mode Gratuit"}
             </span>

             {/* Badge Visibilité */}
             <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isVisible ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                <Activity size={14}/>
                {isVisible ? "Profil Public Visible" : "Profil Masqué"}
             </span>
          </div>
        </div>

        <button
          onClick={() => { logout(); router.replace("/pro/login"); }}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all self-start"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>

      {/* GRILLE D'ACTIONS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {/* 1. Mon Profil (Edition + Galerie) */}
        <Link href="/pro/profil" className="group relative rounded-2xl border border-white/10 bg-zinc-900/30 p-6 hover:bg-zinc-900 hover:border-indigo-500/30 transition-all">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <User size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Mon Profil & Galerie</h3>
          <p className="text-sm text-zinc-400 mb-6">
            Modifiez vos coordonnées, gérez votre galerie photos/vidéos et mettez à jour votre CV.
          </p>
          <div className="flex items-center text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
            Gérer mon profil &rarr;
          </div>
        </Link>

        {/* 2. Annonces (Offres d'emploi) */}
        <Link href="/pro/annonces" className="group relative rounded-2xl border border-white/10 bg-zinc-900/30 p-6 hover:bg-zinc-900 hover:border-emerald-500/30 transition-all">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <Megaphone size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Mes Annonces</h3>
          <p className="text-sm text-zinc-400 mb-6">
            Publiez des offres d'emploi ou consultez les demandes disponibles dans votre secteur.
          </p>
          <div className="flex items-center text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
            Gérer mes annonces &rarr;
          </div>
        </Link>

        {/* 3. Abonnement Premium */}
        <Link href="/pro/premium" className="group relative rounded-2xl border border-white/10 bg-zinc-900/30 p-6 hover:bg-zinc-900 hover:border-amber-500/30 transition-all">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <CreditCard size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Abonnement</h3>
          <p className="text-sm text-zinc-400 mb-6">
            {isPremium
              ? `Abonnement actif. Expire dans ${billing?.days_left ?? "?"} jours.`
              : "Activez Premium pour débloquer les appels et WhatsApp."}
          </p>
          <div className="flex items-center text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
            {isPremium ? "Voir détails" : "Passer Premium"} &rarr;
          </div>
        </Link>

      </div>

      {/* LIEN RAPIDE : VOIR SA FICHE PUBLIQUE */}
      {pro?.slug && (
        <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 p-1">
          <Link href={`/pros/${pro.slug}`} target="_blank" className="flex items-center justify-between rounded-xl bg-black/40 p-4 hover:bg-black/20 transition-colors">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                   <ExternalLink size={20}/>
                </div>
                <div>
                   <div className="font-semibold text-white">Voir ma fiche publique</div>
                   <div className="text-xs text-zinc-400">Aperçu de ce que voient vos clients</div>
                </div>
             </div>
             <div className="text-indigo-400 text-sm font-medium">Ouvrir &rarr;</div>
          </Link>
        </div>
      )}

    </main>
  );
}