"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listFavoris, removeFavori } from "@/lib/pros.api";
import ProCard from "@/components/ProCard";
import { UserPlus, Search, BookHeart, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const [searchTerm, setSearchTerm] = useState("");

  // Protection Route
  useEffect(() => {
    if (!token) router.replace("/pro/login");
  }, [token, router]);

  // Fetch Data
  const { data, isLoading } = useQuery({
    queryKey: ["favoris"],
    queryFn: () => listFavoris({ page: 1, page_size: 100 }),
    enabled: !!token,
  });

  // Mutation Suppression
  const removeMutation = useMutation({
    mutationFn: (proId: number) => removeFavori(proId),
    onMutate: async (proId) => {
      // Optimistic Update
      await qc.cancelQueries({ queryKey: ["favoris"] });
      const previous = qc.getQueryData(["favoris"]);

      qc.setQueryData(["favoris"], (old: any) => ({
        ...old,
        results: old?.results?.filter((f: any) => f.professionnel !== proId) ?? [],
        count: (old?.count || 1) - 1,
      }));

      return { previous };
    },
    onError: (err, newTodo, context) => {
      qc.setQueryData(["favoris"], context?.previous);
      toast.error("Impossible de retirer ce contact.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["favoris"] });
      qc.invalidateQueries({ queryKey: ["favoris-ids"] });
    },
  });

  if (!token) return null;

  const allFavoris = data?.results ?? [];

  // Filtrage Client-Side (Nom ou Métier)
  const filteredFavoris = allFavoris.filter((fav: any) => {
    const term = searchTerm.toLowerCase();
    const pro = fav.professionnel_details;
    return (
      pro.nom_entreprise?.toLowerCase().includes(term) ||
      pro.metier_name?.toLowerCase().includes(term)
    );
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
             <BookHeart className="text-[#00FF00]" size={32} />
             Mes Contacts
          </h1>
          <p className="text-zinc-400 max-w-lg">
            Retrouvez ici tous les professionnels que vous avez sauvegardés pour vos futurs projets.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Barre de recherche locale */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
                type="text"
                placeholder="Filtrer (ex: plombier)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF00]/50 transition-colors"
            />
          </div>

          <Link
            href="/recherche"
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 shrink-0"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Ajouter</span>
          </Link>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* Loading Skeletons */}
        {isLoading && [1, 2, 3].map((i) => (
            <div key={i} className="h-[280px] rounded-3xl bg-zinc-900/50 border border-white/5 animate-pulse" />
        ))}

        {/* Liste Animée */}
        <AnimatePresence mode="popLayout">
          {filteredFavoris.map((fav: any) => (
            <motion.div
              key={fav.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <ProCard
                pro={fav.professionnel_details}
                isFavorite={true}
                onToggleFavori={(id) => {
                   // Petit délai pour laisser l'utilisateur voir le click
                   removeMutation.mutate(id);
                   toast.info("Contact retiré", { duration: 2000 });
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- EMPTY STATES --- */}

      {/* Cas 1: Pas de favoris du tout */}
      {!isLoading && allFavoris.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border border-dashed border-white/10 bg-zinc-900/30">
          <div className="relative mb-6">
             <div className="absolute inset-0 bg-[#00FF00]/10 blur-xl rounded-full" />
             <div className="relative h-20 w-20 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center text-zinc-500">
                <BookHeart size={32} />
             </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Votre carnet est vide</h3>
          <p className="text-zinc-400 max-w-sm mb-8 leading-relaxed">
            Sauvegardez les meilleurs artisans pour les retrouver facilement quand vous en aurez besoin.
          </p>
          <Link
            href="/recherche"
            className="flex items-center gap-2 text-[#00FF00] font-bold hover:underline underline-offset-4"
          >
            Explorer l'annuaire <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Cas 2: Recherche sans résultat */}
      {!isLoading && allFavoris.length > 0 && filteredFavoris.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500">
             <Search size={48} className="mx-auto mb-4 opacity-20" />
             <p>Aucun contact ne correspond à "{searchTerm}"</p>
             <button
                onClick={() => setSearchTerm("")}
                className="text-[#00FF00] text-sm mt-2 hover:underline"
            >
                Réinitialiser la recherche
             </button>
          </div>
      )}
    </main>
  );
}