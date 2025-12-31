"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFeaturedJobs } from "@/lib/catalog.api";
import {
  rechercherPros,
  listFavoris,
  addFavori,
  removeFavori
} from "@/lib/pros.api";
import { useAuthStore } from "@/lib/auth.store";
import ProCard from "@/components/ProCard";
import Link from "next/link";
import { Search, Sparkles, ArrowRight, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  // 1. Récupérer les Jobs Featured
  const {
    data: jobs = [],
    isLoading: jobsLoading,
    isError: jobsError,
  } = useQuery({
    queryKey: ["jobs-featured"],
    queryFn: getFeaturedJobs,
    staleTime: 1000 * 60 * 30, // 30 min
  });

  // 2. Récupérer les Pros Recommandés
  const {
    data: prosData,
    isLoading: prosLoading,
    isError: prosError,
  } = useQuery({
    queryKey: ["home-pros"],
    queryFn: () => rechercherPros({ page: 1, page_size: 10 }),
    staleTime: 1000 * 60 * 5, // 5 min
  });

  const pros = prosData?.results ?? [];

  // 3. Récupérer les IDs des favoris (pour afficher les coeurs pleins)
  const { data: favIds } = useQuery({
    queryKey: ["favoris-ids"],
    queryFn: async () => {
      if (!token) return new Set<number>();
      const data = await listFavoris({ page: 1, page_size: 100 });
      return new Set((data.results ?? []).map((fav) => fav.professionnel));
    },
    enabled: !!token,
  });

  // 4. Mutation Toggle Favori
  const toggleFavoriMutation = useMutation({
    mutationFn: async (proId: number) => {
      if (!token) {
        router.push("/pro/login");
        throw new Error("Login required");
      }
      const isFav = favIds?.has(proId);
      if (isFav) return removeFavori(proId);
      return addFavori(proId);
    },
    onSuccess: () => {
      // On invalide pour rafraîchir les coeurs partout
      queryClient.invalidateQueries({ queryKey: ["favoris-ids"] });
      queryClient.invalidateQueries({ queryKey: ["favoris"] });
      toast.success("Favoris mis à jour");
    },
    onError: (err: any) => {
      if (err?.message !== "Login required") toast.error("Erreur lors de la mise à jour");
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-10">

      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-black p-8 text-center md:text-left shadow-2xl shadow-indigo-900/20 border border-white/10">
        {/* Effets de fond */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl leading-tight">
              Trouvez le bon pro <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                partout au Sénégal.
              </span>
            </h1>
            <p className="text-indigo-200/80 text-lg">
              Plombiers, Mécaniciens, Couturiers... Accédez aux meilleurs contacts recommandés et vérifiés autour de vous.
            </p>

            {/* Barre de recherche factice (Bouton) */}
            <button
              onClick={() => router.push("/recherche")}
              className="mt-6 flex w-full max-w-md items-center gap-3 rounded-2xl bg-white/10 px-5 py-4 text-indigo-100 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-[1.02] border border-white/10 shadow-lg group"
            >
              <Search className="h-5 w-5 text-indigo-300 group-hover:text-white transition-colors" />
              <span className="text-sm font-medium opacity-90">Rechercher un métier, une zone...</span>
            </button>
          </div>

          {/* CTA "Devenir Pro" */}
          <div className="hidden md:block shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md hover:bg-white/10 transition-colors max-w-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Briefcase size={24} />
                </div>
                <div>
                  <div className="font-bold text-white text-lg">Vous êtes un pro ?</div>
                  <div className="text-xs text-zinc-400">Boostez votre visibilité dès aujourd'hui</div>
                </div>
              </div>

              <Link
                href="/pro/register"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl"
              >
                Créer ma fiche gratuite
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* JOBS FEATURED */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="text-amber-400 fill-amber-400/20" size={20} />
            Les professions populaires
          </h2>
          <Link href="/recherche" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:underline">
            Voir tout
          </Link>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {jobsLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-9 w-28 rounded-full bg-white/5 animate-pulse" />)
          ) : jobsError ? (
            <div className="text-sm text-zinc-500">Impossible de charger les métiers.</div>
          ) : (
            jobs.slice(0, 14).map((j) => (
              <Link
                key={j.id}
                href={`/recherche?metier=${j.id}`}
                className="rounded-full border border-white/10 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-indigo-500/50 hover:bg-indigo-500/20 hover:text-white transition-all shadow-sm"
              >
                {j.name}
              </Link>
            ))
          )}
        </div>
      </section>

      {/* PROS RECOMMANDÉS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Recommandés pour vous</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {prosLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
            ))
          ) : prosError ? (
            <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-zinc-500">Impossible de charger les recommandations.</p>
                <button onClick={() => window.location.reload()} className="text-indigo-400 text-sm mt-2 hover:underline">Réessayer</button>
            </div>
          ) : (
            pros.slice(0, 6).map((p) => {
              const isFav = favIds?.has(p.id) ?? false;

              return (
                // Lien vers le détail
                <Link key={p.id} href={`/pros/${p.id}`} className="block h-full transition-transform hover:scale-[1.01]">
                  <ProCard
                    pro={p}
                    isFavorite={isFav}
                    onToggleFavori={(id) => toggleFavoriMutation.mutate(id)}
                  />
                </Link>
              );
            })
          )}
        </div>

        <div className="flex justify-center pt-4">
          <Link
            href="/recherche"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
          >
            Explorer tous les professionnels
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}