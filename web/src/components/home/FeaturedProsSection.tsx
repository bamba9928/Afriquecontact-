"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  rechercherPros,
  listFavoris,
  addFavori,
  removeFavori
} from "@/lib/pros.api";
import { useAuthStore } from "@/lib/auth.store";
import ProCard from "@/components/ProCard";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Sparkles } from "lucide-react";

export function FeaturedProsSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  // --- 1. DATA FETCHING ---
  const { data: prosData, isLoading: prosLoading } = useQuery({
    queryKey: ["home-pros"],
    queryFn: () => rechercherPros({ page: 1, page_size: 8 }), // Top 8
    staleTime: 1000 * 60 * 5,
  });
  const pros = prosData?.results ?? [];

  const { data: favIds } = useQuery({
    queryKey: ["favoris-ids"],
    queryFn: async () => {
      if (!token) return new Set<number>();
      const data = await listFavoris({ page: 1, page_size: 100 });
      return new Set((data.results ?? []).map((fav) => fav.professionnel));
    },
    enabled: !!token,
  });

  // --- 2. OPTIMISTIC UI FOR FAVORITES ---
  const toggleFavoriMutation = useMutation({
    mutationFn: async (proId: number) => {
      if (!token) throw new Error("Login required");
      const isFav = favIds?.has(proId);
      return isFav ? removeFavori(proId) : addFavori(proId);
    },
    onMutate: async (proId) => {
      await queryClient.cancelQueries({ queryKey: ["favoris-ids"] });
      const previousFavs = queryClient.getQueryData<Set<number>>(["favoris-ids"]);

      queryClient.setQueryData<Set<number>>(["favoris-ids"], (old) => {
        const newSet = new Set(old ? Array.from(old) : []);
        if (newSet.has(proId)) newSet.delete(proId);
        else newSet.add(proId);
        return newSet;
      });

      return { previousFavs };
    },
    onError: (err: any, proId, context) => {
      if (context?.previousFavs) {
        queryClient.setQueryData(["favoris-ids"], context.previousFavs);
      }
      if (err?.message === "Login required") {
        toast.error("Connectez-vous pour ajouter aux favoris");
        router.push("/pro/login");
      } else {
        toast.error("Une erreur est survenue");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favoris-ids"] });
    },
  });

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">

      {/* Background Decor (Blob subtil) */}
      <div className="absolute top-0 right-0 -z-10 translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
          <div className="w-[600px] h-[600px] bg-emerald-500/20 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[#00FF00] text-sm font-bold uppercase tracking-widest mb-1">
              <Sparkles size={14} />
              <span>Sélection de la semaine</span>
            </div>
            <h2 id="featured-pros-title" className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Les experts <br className="md:hidden"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#00FF00]">
                recommandés
              </span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Des artisans et professionnels vérifiés, prêts à intervenir près de chez vous.
            </p>
          </div>

          <button
            onClick={() => router.push("/recherche")}
            className="hidden md:flex items-center gap-2 text-white hover:text-[#00FF00] font-semibold transition-colors group"
          >
            Voir tous les pros
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* --- CONTENT GRID --- */}
        {prosLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <ProCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pros.map((p) => {
              const isFav = favIds?.has(p.id) ?? false;
              return (
                <div key={p.id} className="h-full">
                  {/* Note: Pas de <Link> ici car ProCard gère déjà le click */}
                  <ProCard
                    pro={p}
                    isFavorite={isFav}
                    onToggleFavori={(id) => toggleFavoriMutation.mutate(id)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* --- MOBILE CTA --- */}
        <div className="flex md:hidden justify-center pt-4">
          <button
            onClick={() => router.push("/recherche")}
            className="w-full max-w-sm flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-white/10 px-6 py-4 text-white font-bold transition-all hover:bg-zinc-800"
          >
            Explorer tout le catalogue
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

// --- SOUS-COMPOSANT : SKELETON LOADING ---
function ProCardSkeleton() {
  return (
    <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-5 h-[280px] flex flex-col gap-4 animate-pulse">
      {/* Header: Avatar + Lines */}
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-2xl bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/5" />
        </div>
      </div>

      {/* Body Lines */}
      <div className="space-y-2 mt-2">
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-2/3 rounded bg-white/5" />
      </div>

      <div className="flex-1" />

      {/* Footer Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="h-10 rounded-xl bg-white/10" />
        <div className="h-10 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}