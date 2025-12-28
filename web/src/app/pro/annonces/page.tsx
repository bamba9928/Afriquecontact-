"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mesAnnonces, deleteAnnonce } from "@/lib/annonces.api"; // Assurez-vous d'importer deleteAnnonce
import Link from "next/link";
import { Plus, Pencil, Trash2, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// Utilitaire de formatage (à extraire dans un utils.ts idéalement)
const formatPrice = (price?: number | string) => {
  if (!price) return "Prix sur demande";
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("fr-SN", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function MesAnnoncesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) router.replace("/pro/login");
  }, [token, router]);

  const { data: annonces, isLoading } = useQuery({
    queryKey: ["mes-annonces"],
    queryFn: mesAnnonces,
    enabled: !!token
  });

  // Mutation pour la suppression
  const deleteMutation = useMutation({
    mutationFn: deleteAnnonce,
    onSuccess: () => {
      // On rafraîchit la liste sans recharger la page
      queryClient.invalidateQueries({ queryKey: ["mes-annonces"] });
    },
    onError: () => alert("Impossible de supprimer cette annonce."),
  });

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      deleteMutation.mutate(id);
    }
  };

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes Annonces</h1>
          <p className="text-zinc-400 text-sm">Gérez vos offres et demandes d'emploi.</p>
        </div>
        <Link
          href="/pro/annonces/nouveau" // Route à créer : le formulaire
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
        >
          <Plus size={18} />
          Nouvelle annonce
        </Link>
      </div>

      {/* LISTE */}
      {(!annonces || annonces.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
          <div className="rounded-full bg-white/10 p-4 mb-3">
             <Plus size={24} className="text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-white">Aucune annonce</h3>
          <p className="text-sm text-zinc-500 max-w-xs mt-1 mb-4">
            Vous n'avez rien publié pour l'instant. Créez votre première annonce pour être visible.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a) => (
            <article
              key={a.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/50 p-5 transition-all hover:border-white/20"
            >
              <div className="space-y-3">
                {/* Badge Statut */}
                <div className="flex items-center justify-between">
                  {a.est_approuvee ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                      <CheckCircle size={10} /> En ligne
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                      <Clock size={10} /> En attente
                    </span>
                  )}
                  <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
                    {a.type}
                  </span>
                </div>

                {/* Titre & Prix */}
                <div>
                  <h3 className="font-semibold text-white line-clamp-1" title={a.titre}>
                    {a.titre ?? "Annonce sans titre"}
                  </h3>
                  <div className="mt-1 text-lg font-bold text-white">
                    {formatPrice(a.prix)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {a.ville ?? "Localisation non précisée"}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 flex items-center gap-2 pt-4 border-t border-white/5">
                <Link
                  href={`/pro/annonces/modifier/${a.id}`} // Route à créer
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <Pencil size={14} /> Modifier
                </Link>

                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deleteMutation.isPending}
                  className="flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Supprimer"
                >
                  {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}