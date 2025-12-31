"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAnnonces } from "@/lib/annonces.api";
import Link from "next/link";
import { Plus, Tag, MapPin, Clock, ShoppingBag, Search } from "lucide-react";

// --- Utilitaires de formatage ---

const formatPrice = (price?: number | string) => {
  if (!price) return "Prix sur demande";
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("fr-SN", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
};

export default function AnnoncesPage() {
  // Onglets: OFFRE / DEMANDE
  const [activeTab, setActiveTab] = useState<"OFFRE" | "DEMANDE">("OFFRE");

  const { data: annonces, isLoading } = useQuery({
    queryKey: ["annonces", "type_annonce", activeTab],
    // Si l'API supporte: filtrage serveur par type_annonce
    // Ajuste la clé/valeur si ton backend attend un autre nom (ex: type="offre"/"demande")
    queryFn: () => listAnnonces({ type_annonce: activeTab }),
  });

  // Fallback si l'API ignore le paramètre: filtrage côté client
  const annoncesFiltrees = useMemo(() => {
    const list = annonces ?? [];
    // Si ton objet "a" expose déjà type_annonce => utilise ça, sinon adapte (ex: a.type)
    return list.filter((a: any) => (a.type_annonce ?? a.type) === activeTab);
  }, [annonces, activeTab]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* HEADER : Titre + Bouton Publier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Annonces d’emploi</h1>
          <p className="text-zinc-400 text-sm">Consultez les offres et les demandes d’emploi.</p>
        </div>

        <Link
          href="/pro/annonces"
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
        >
          <Plus size={18} />
          Publier une annonce
        </Link>
      </div>

      {/* TABS: OFFRES / DEMANDES */}
      <div className="flex gap-4 border-b border-white/10 mb-2">
        <button
          onClick={() => setActiveTab("OFFRE")}
          className={`pb-2 text-sm font-medium ${
            activeTab === "OFFRE"
              ? "text-indigo-400 border-b-2 border-indigo-400"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Offres d&apos;emploi
        </button>

        <button
          onClick={() => setActiveTab("DEMANDE")}
          className={`pb-2 text-sm font-medium ${
            activeTab === "DEMANDE"
              ? "text-indigo-400 border-b-2 border-indigo-400"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Demandes d&apos;emploi
        </button>
      </div>

      {/* GRILLE D'ANNONCES */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-2xl border border-white/5 bg-zinc-900 animate-pulse" />
          ))
        ) : (
          annoncesFiltrees.map((a: any) => {
            const type = a.type_annonce ?? a.type; // adapte si besoin
            const isOffre = type === "OFFRE" || type === "offre";

            return (
              <article
                key={a.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/50 p-5 hover:border-white/20 hover:bg-zinc-900 transition-all cursor-pointer"
              >
                <div>
                  {/* Badge Type & Date */}
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        isOffre
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {isOffre ? <Tag size={10} /> : <Search size={10} />}
                      {String(type ?? "").toLowerCase()}
                    </span>

                    {a.cree_le && (
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Clock size={12} />
                        {formatDate(a.cree_le)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold leading-snug text-white group-hover:underline decoration-white/30 underline-offset-4">
                    {a.titre ?? "Annonce sans titre"}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                    <MapPin size={14} />
                    <span>{a.ville ?? "Sénégal"}</span>
                  </div>
                </div>

                {/* Prix & Action */}
                <div className="mt-5 flex items-end justify-between border-t border-white/5 pt-4">
                  <div className="font-bold text-white text-lg">{formatPrice(a.prix)}</div>
                  <div className="text-xs font-medium text-indigo-400 group-hover:translate-x-1 transition-transform">
                    Voir détails &rarr;
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Empty State */}
      {!isLoading && annoncesFiltrees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
          <ShoppingBag className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium text-white">Aucune annonce trouvée</h3>
          <p className="text-sm text-zinc-500 max-w-sm mt-2 mb-6">
            Il n&apos;y a pas encore d&apos;annonces dans cette catégorie. Soyez le premier à en publier une !
          </p>
          <Link href="/pro/annonces" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Publier maintenant &rarr;
          </Link>
        </div>
      )}
    </main>
  );
}
