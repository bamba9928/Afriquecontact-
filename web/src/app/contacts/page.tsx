"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listFavoris, removeFavori } from "@/lib/pros.api";
import ProCard from "@/components/ProCard";
import { UserPlus, HeartOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ContactsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  // Redirection si non connecté
  useEffect(() => {
    if (!token) router.replace("/pro/login");
  }, [token, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["favoris"],
    queryFn: () => listFavoris({ page: 1, page_size: 100 }), // On récupère une liste large
    enabled: !!token,
  });

  const removeMutation = useMutation({
    mutationFn: (proId: number) => removeFavori(proId),
    onMutate: async (proId) => {
      // Optimistic update : on retire l'élément de la liste immédiatement
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
      toast.error("Impossible de retirer ce favori.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["favoris"] });
      // On rafraîchit aussi la recherche pour que les cœurs se mettent à jour là-bas
      qc.invalidateQueries({ queryKey: ["pros-recherche"] });
      qc.invalidateQueries({ queryKey: ["favoris-ids"] });
    },
  });

  if (!token) return null;

  const favoris = data?.results ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Mes Contacts</h1>
          <p className="text-sm text-zinc-400">
            {isLoading ? "Chargement..." : `${favoris.length} professionnel(s) sauvegardé(s).`}
          </p>
        </div>
        <Link
          href="/recherche"
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
        >
          <UserPlus size={18} />
          Trouver un pro
        </Link>
      </div>

      {/* Grille */}
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-2xl border border-white/5 bg-zinc-900 animate-pulse" />
          ))
        ) : (
          favoris.map((fav: any) => (
            <div key={fav.id} className="relative group">
              {/* Lien vers le détail complet du pro */}
              <Link href={`/pros/${fav.professionnel}`} className="block h-full transition-transform hover:scale-[1.01]">
                <ProCard
                  pro={fav.professionnel_details}
                  isFavorite={true}
                  // On passe une fonction vide ou qui stopPropagation pour éviter double click
                  onToggleFavori={(id) => {
                     removeMutation.mutate(id);
                  }}
                />
              </Link>

              {/* Bouton Retirer Explicite (superposé) */}
              <button
                onClick={(e) => {
                  e.preventDefault(); // Empêche d'ouvrir la fiche pro
                  e.stopPropagation();
                  removeMutation.mutate(fav.professionnel);
                }}
                className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 border border-red-500/20 backdrop-blur-md hover:bg-red-500/20 transition-all shadow-xl"
              >
                <Trash2 size={12} /> Retirer
              </button>
            </div>
          ))
        )}
      </div>

      {/* Empty State */}
      {!isLoading && favoris.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
          <div className="rounded-full bg-white/10 p-4 mb-4">
            <HeartOff size={32} className="text-zinc-500" />
          </div>
          <h3 className="text-lg font-medium text-white">Carnet d&apos;adresses vide</h3>
          <p className="text-sm text-zinc-500 max-w-xs mt-2 mb-6">
            Vous n&apos;avez pas encore ajouté de contacts. Recherchez des professionnels et cliquez sur le cœur pour les retrouver ici.
          </p>
          <Link href="/recherche" className="text-indigo-400 hover:text-indigo-300 font-medium underline-offset-4 hover:underline">
            Explorer l&apos;annuaire &rarr;
          </Link>
        </div>
      )}
    </main>
  );
}