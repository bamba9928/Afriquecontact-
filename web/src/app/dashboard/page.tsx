"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth.store";
import { getProMe } from "@/lib/pros.api";
import { billingMe } from "@/lib/billing.api";

import {
  LogOut, User, Activity, Loader2, CreditCard,
  Megaphone, ExternalLink, ShieldCheck, AlertTriangle,
  Eye, MousePointerClick, ChevronRight, Settings, Sparkles
} from "lucide-react";
import { clsx } from "clsx";

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!accessToken) {
      router.replace("/pro/login");
    }
  }, [accessToken, router]);

  // Données
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

  const isLoading = proLoading || billingLoading || !mounted;
  const isPremium = !!(billing?.is_active ?? billing?.active);
  const isVisible = pro?.est_publie;
  const daysLeft = billing?.days_left ?? 0;

  // Calcul pourcentage abonnement (base 30 jours) pour la barre de progression
  const progressPercent = Math.min(100, Math.max(0, (daysLeft / 30) * 100));

  if (!accessToken) return null;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#00FF00]" />
        <p className="text-zinc-500 text-sm animate-pulse">Chargement de votre espace...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8 space-y-8">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Vue d'ensemble
          </h1>
          <p className="text-zinc-400">Gérez votre activité et analysez vos performances.</p>
        </div>

        <div className="flex items-center gap-3">
          {pro?.slug && (
            <Link
              href={`/pros/${pro.slug}`}
              target="_blank"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <ExternalLink size={16} /> Voir mon profil public
            </Link>
          )}

          <button
            onClick={() => { logout(); router.replace("/pro/login"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={16} /> <span className="hidden md:inline">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* --- HERO CARD (Statut Abonnement) --- */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl">
        {/* Background Glow */}
        <div className={clsx(
            "absolute top-0 right-0 w-96 h-96 blur-[100px] rounded-full pointer-events-none opacity-20",
            isPremium ? "bg-emerald-500" : "bg-amber-500"
        )} />

        <div className="relative z-10 p-6 md:p-8 grid md:grid-cols-3 gap-8 items-center">

            {/* Colonne Gauche : User Info */}
            <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-2xl font-bold text-white uppercase overflow-hidden">
                        {pro?.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={pro.avatar} alt="Avatar" className="h-full w-full object-cover" />
                        ) : pro?.nom_entreprise?.[0]}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{pro?.nom_entreprise}</h2>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            {isVisible ? (
                                <span className="flex items-center gap-1.5 text-emerald-400">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    En ligne
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-zinc-500">
                                    <span className="h-2 w-2 rounded-full bg-zinc-600"/> Hors ligne
                                </span>
                            )}
                            <span>•</span>
                            <span>{pro?.metier_name || "Métier non défini"}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar (Si Premium) */}
                {isPremium ? (
                    <div className="space-y-2 max-w-md">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-emerald-400">Abonnement Actif</span>
                            <span className="text-zinc-400">Reste {daysLeft} jours</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                style={{ width: `${progressPercent}%` }}
                                className="h-full bg-gradient-to-r from-emerald-500 to-[#00FF00] transition-all duration-1000"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-md">
                         <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                         <div>
                             <p className="text-sm font-bold text-amber-500">Mode Gratuit</p>
                             <p className="text-xs text-amber-200/70 mt-1">Vos contacts sont masqués. Passez Pro pour débloquer les appels.</p>
                         </div>
                    </div>
                )}
            </div>

            {/* Colonne Droite : CTA */}
            <div className="flex justify-start md:justify-end">
                <Link
                    href="/pro/premium"
                    className={clsx(
                        "group relative flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all overflow-hidden",
                        isPremium
                            ? "bg-zinc-800 text-white hover:bg-zinc-700 border border-white/5"
                            : "bg-[#00FF00] text-black hover:bg-[#00cc00] shadow-[0_0_30px_rgba(0,255,0,0.3)]"
                    )}
                >
                     {isPremium ? <CreditCard size={20} /> : <Sparkles size={20} />}
                     <span>{isPremium ? "Gérer mon abonnement" : "Passer Premium"}</span>
                     <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
      </section>

      {/* --- STATS RAPIDES --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <StatCard label="Vues Profil" value="1,204" icon={Eye} trend="+12%" />
         <StatCard label="Clics Appel" value="48" icon={MousePointerClick} trend="+5%" />
         <StatCard label="Annonces" value="3" icon={Megaphone} />
         <StatCard label="Note Moyenne" value="4.8/5" icon={ShieldCheck} highlight />
      </div>

      {/* --- ACTIONS GRID (BENTO) --- */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* CARD 1: PROFIL */}
        <Link href="/pro/profil" className="group relative overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 p-8 transition-all hover:border-white/10 hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <User size={80} />
            </div>
            <div className="mb-6 h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Settings size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Mon Profil</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Mettez à jour vos informations, ajoutez des photos à votre galerie et importez votre CV.
            </p>
            <span className="text-sm font-bold text-blue-400 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                Éditer les infos <ChevronRight size={16} />
            </span>
        </Link>

        {/* CARD 2: ANNONCES */}
        <Link href="/pro/annonces" className="group relative overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 p-8 transition-all hover:border-white/10 hover:shadow-2xl hover:-translate-y-1">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Megaphone size={80} />
            </div>
            <div className="mb-6 h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Megaphone size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Mes Annonces</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Gérez vos offres d'emploi ou publiez une demande de service pour la communauté.
            </p>
             <span className="text-sm font-bold text-emerald-400 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                Voir mes annonces <ChevronRight size={16} />
            </span>
        </Link>

        {/* CARD 3: ABONNEMENT */}
        <Link href="/pro/premium" className="group relative overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 p-8 transition-all hover:border-white/10 hover:shadow-2xl hover:-translate-y-1">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CreditCard size={80} />
            </div>
            <div className="mb-6 h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <CreditCard size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Facturation</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Consultez l'état de votre abonnement, vos factures et renouvelez votre pack Pro.
            </p>
             <span className="text-sm font-bold text-amber-400 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                Gérer l'abonnement <ChevronRight size={16} />
            </span>
        </Link>

      </div>
    </main>
  );
}

// Composant Statistique
function StatCard({ label, value, icon: Icon, trend, highlight }: any) {
    return (
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
                <Icon size={18} className="text-zinc-500" />
                {trend && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{trend}</span>}
            </div>
            <div className={clsx("text-2xl font-black", highlight ? "text-[#00FF00]" : "text-white")}>{value}</div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide mt-1">{label}</div>
        </div>
    )
}