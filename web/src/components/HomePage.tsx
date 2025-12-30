"use client";

import { useQuery } from "@tanstack/react-query";
import { getFeaturedJobs } from "@/lib/catalog.api";
import { rechercherPros } from "@/lib/pros.api";
import ProCard from "@/components/ProCard";
import Link from "next/link";
import { Search, Sparkles, ArrowRight, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  // Requêtes avec StaleTime pour la perf
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs-featured"],
    queryFn: getFeaturedJobs,
    staleTime: 1000 * 60 * 10 // 10 min
  });

  const { data: pros, isLoading: prosLoading } = useQuery({
      queryKey: ["home-pros"],
      queryFn: async () => {
        const data = await rechercherPros({ page: 1, page_size: 10 });
        return data.results ?? [];
      },
    });


  // Gestionnaire de favori rapide
  const handleToggleFavori = (id: number) => {
    console.log("Toggle favori pour", id);
    // TODO: Connecter à la mutation addFavori
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-10">

      {/* 1. HERO SECTION : Recherche & Appel à l'action */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 to-black p-8 text-center md:text-left shadow-2xl shadow-indigo-900/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Trouvez le bon pro <br />
              <span className="text-indigo-400">partout au Sénégal.</span>
            </h1>
            <p className="text-indigo-200/80">
              Plombiers, Mécaniciens, Couturiers... Accédez aux meilleurs contacts recommandés autour de vous.
            </p>

            {/* Fausse barre de recherche qui redirige */}
            <div
              onClick={() => router.push("/recherche")}
              className="mt-4 flex w-full max-w-md cursor-pointer items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-indigo-100 backdrop-blur-md transition-all hover:bg-white/20 border border-white/10"
            >
              <Search className="h-5 w-5 opacity-70" />
              <span className="text-sm opacity-70">Rechercher un métier, une ville...</span>
            </div>
          </div>

          {/* Carte "Call to Action" pour les Pros */}
          <div className="hidden md:block">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                  <Briefcase size={20} />
                </div>
                <div>
                  <div className="font-semibold text-white">Vous êtes Pro ?</div>
                  <div className="text-xs text-white/60">Boostez votre visibilité</div>
                </div>
              </div>
              {/* CORRECTION : Redirection vers Login/Dashboard pour s'inscrire, pas vers la liste des pubs */}
              <Link
                href="/pro/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black hover:bg-indigo-50 transition-colors"
              >
                Créer ma fiche
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATÉGORIES POPULAIRES (Chips) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="text-amber-400" size={18} />
            Métiers en vedette
          </h2>
          <Link href="/recherche" className="text-sm text-indigo-400 hover:text-indigo-300">
            Tout voir
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {jobsLoading ? (
             [1,2,3,4,5,6].map(i => (
               <div key={i} className="h-8 w-24 rounded-full bg-white/5 animate-pulse" />
             ))
          ) : (
            (jobs ?? []).slice(0, 12).map((j) => (
              <Link
                key={j.id}
                href={`/recherche?metier=${j.id}`}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-zinc-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white transition-all"
              >
                {j.nom ?? j.name}
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 3. RECOMMANDATIONS (Grille Pros) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recommandés pour vous</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {prosLoading ? (
            [1,2,3,4].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
            ))
          ) : (
            (pros ?? []).slice(0, 10).map((p) => (
              <ProCard
                key={p.id}
                pro={p}
                onToggleFavori={handleToggleFavori}
              />
            ))
          )}
        </div>

        <div className="flex justify-center md:hidden pt-2">
           <Link href="/recherche" className="text-sm font-medium text-zinc-500 border-b border-zinc-700 pb-0.5">
             Voir plus de professionnels
           </Link>
        </div>
      </section>
    </main>
  );
}