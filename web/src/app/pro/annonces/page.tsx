"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mesAnnonces, deleteAnnonce } from "@/lib/annonces.api";
import {
  Plus, Pencil, Trash2, Clock, CheckCircle2,
  MapPin, Loader2, Eye, Calendar, Briefcase, AlertCircle, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";

// Utilitaire de date
const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-SN", {
    day: "numeric",
    month: "short",
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
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#00FF00]" />
        <p className="text-zinc-500 text-sm animate-pulse">Chargement de vos annonces...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-white">
            Mes Annonces
          </h1>
          <p className="text-zinc-400 max-w-lg">
            Gérez vos offres et demandes. Les annonces récentes apparaissent en premier.
          </p>
        </div>

        <Link
          href="/pro/annonces/nouveau"
          className="group flex items-center gap-2 rounded-xl bg-[#00FF00] px-5 py-3 text-sm font-bold text-black transition-all hover:bg-[#00cc00] hover:shadow-[0_0_20px_rgba(0,255,0,0.3)]"
        >
          <Plus size={18} strokeWidth={3} />
          <span>Publier une annonce</span>
        </Link>
      </div>

      {/* --- CONTENT --- */}
      {(!annonces || annonces.length === 0) ? (

        /* EMPTY STATE PREMIUM */
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border border-dashed border-white/10 bg-zinc-900/30">
          <div className="relative mb-6">
             <div className="absolute inset-0 bg-[#00FF00]/20 blur-xl rounded-full" />
             <div className="relative h-20 w-20 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center text-zinc-500">
                <Briefcase size={32} />
             </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Aucune annonce publiée</h3>
          <p className="text-zinc-400 max-w-sm mb-8 leading-relaxed">
            C'est ici que vous verrez vos annonces. Commencez dès maintenant pour toucher de nouveaux clients.
          </p>
          <Link
            href="/pro/annonces/nouveau"
            className="flex items-center gap-2 text-[#00FF00] font-bold hover:underline underline-offset-4"
          >
            Créer ma première annonce <ArrowRight size={16} />
          </Link>
        </div>

      ) : (

        /* GRID LIST */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a: any) => (
            <article
              key={a.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-zinc-900/40 p-1 transition-all hover:bg-zinc-900 hover:border-white/10 hover:shadow-2xl"
            >
              <div className="p-5 space-y-5">

                {/* Header Card: Status & Views */}
                <div className="flex items-center justify-between">
                  <div className={clsx(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border",
                      a.est_approuvee
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  )}>
                    {a.est_approuvee ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {a.est_approuvee ? "En ligne" : "En attente"}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-white/5 px-2 py-1 rounded-md">
                    <Eye size={12} />
                    <span>{a.nb_vues || 0} vues</span>
                  </div>
                </div>

                {/* Body Card */}
                <div>
                    <h3 className="font-bold text-white text-lg line-clamp-2 leading-snug group-hover:text-[#00FF00] transition-colors mb-3">
                        {a.titre}
                    </h3>

                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Briefcase size={14} className="text-zinc-600 shrink-0"/>
                            <span className="truncate">{a.categorie_name || a.categorie || "Non catégorisé"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <MapPin size={14} className="text-zinc-600 shrink-0"/>
                            <span className="truncate">{a.adresse_precise || a.zone_name || "Sénégal"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Calendar size={14} className="text-zinc-600 shrink-0"/>
                            <span>{formatDate(a.cree_le)}</span>
                        </div>
                    </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-2 grid grid-cols-2 gap-1 border-t border-white/5 bg-white/[0.02] p-2">
                <Link
                  href={`/pro/annonces/modifier/${a.id}`}
                  className="flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Pencil size={14} /> Modifier
                </Link>

                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deleteMutation.isPending}
                  className="flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Supprimer
                </button>
              </div>

            </article>
          ))}
        </div>
      )}
    </main>
  );
}