"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mesAnnonces, deleteAnnonce } from "@/lib/annonces.api";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, Clock, CheckCircle,
  MapPin, Loader2, Eye, Calendar, Briefcase
} from "lucide-react";
import { toast } from "sonner";

// Utilitaire de date
const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-SN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function MesAnnoncesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  // Protection de la route
  useEffect(() => {
    if (!token) router.replace("/pro/login");
  }, [token, router]);

  const { data: annonces, isLoading } = useQuery({
    queryKey: ["mes-annonces"],
    queryFn: mesAnnonces,
    enabled: !!token
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnonce,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mes-annonces"] });
      toast.success("Annonce supprimée avec succès");
    },
    onError: () => toast.error("Impossible de supprimer cette annonce."),
  });

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette annonce définitivement ?")) {
      deleteMutation.mutate(id);
    }
  };

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Mes Annonces</h1>
          <p className="text-zinc-400 text-sm">Suivez l'état de vos offres et demandes.</p>
        </div>
        <Link
          href="/pro/annonces/nouveau"
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
        >
          <Plus size={18} />
          Publier une annonce
        </Link>
      </div>

      {/* LISTE */}
      {(!annonces || annonces.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
          <div className="rounded-full bg-white/10 p-5 mb-4">
             <Briefcase size={32} className="text-zinc-500" />
          </div>
          <h3 className="text-lg font-medium text-white">Aucune annonce publiée</h3>
          <p className="text-sm text-zinc-500 max-w-xs mt-2 mb-6">
            Proposez vos services ou recherchez un emploi pour augmenter votre visibilité.
          </p>
          <Link
            href="/pro/annonces/nouveau"
            className="text-indigo-400 hover:text-indigo-300 font-medium underline-offset-4 hover:underline"
          >
            Créer ma première annonce
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a: any) => (
            <article
              key={a.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/50 p-5 transition-all hover:border-indigo-500/30 hover:bg-zinc-900 group"
            >
              <div className="space-y-4">
                {/* Badges Statut & Type */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {a.est_approuvee ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        <CheckCircle size={10} /> VALIDE
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                        <Clock size={10} /> EN ATTENTE
                        </span>
                    )}
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold border ${a.type === 'OFFRE' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-purple-500/10 text-purple-300 border-purple-500/20'}`}>
                        {a.type}
                    </span>
                  </div>

                  {/* Compteur de vues */}
                  <div className="flex items-center gap-1 text-xs text-zinc-500" title="Nombre de vues">
                    <Eye size={12} /> {a.nb_vues || 0}
                  </div>
                </div>

                {/* Contenu Principal */}
                <div>
                  <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-indigo-400 transition-colors" title={a.titre}>
                    {a.titre}
                  </h3>

                  <div className="mt-3 space-y-2">
                    {/* Catégorie */}
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Briefcase size={14} className="shrink-0"/>
                        <span className="truncate">{a.categorie_name || a.categorie || "Non catégorisé"}</span>
                    </div>

                    {/* Localisation (Zone ou Adresse précise) */}
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <MapPin size={14} className="shrink-0"/>
                        <span className="truncate">
                            {a.adresse_precise || a.zone_name || "Sénégal"}
                        </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Calendar size={14} className="shrink-0"/>
                        <span>Publié le {formatDate(a.cree_le)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-white/5">
                <Link
                  href={`/pro/annonces/modifier/${a.id}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium hover:bg-white/10 hover:text-white transition-colors text-zinc-300"
                >
                  <Pencil size={14} /> Modifier
                </Link>

                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deleteMutation.isPending}
                  className="flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Supprimer l'annonce"
                >
                  {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}