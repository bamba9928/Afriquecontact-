"use client";

import { useQuery } from "@tanstack/react-query";
import { getAds, trackAdClick } from "@/lib/ads.api";
import { mediaUrl } from "@/lib/media-url";
import Image from "next/image";
import { ExternalLink, Sparkles } from "lucide-react";

export function AdsSection() {
  const { data: ads, isLoading } = useQuery({
    queryKey: ["ads-home"],
    queryFn: getAds,
    staleTime: 1000 * 60 * 5,
  });

  // Loading State (Skeleton)
  if (isLoading) return <AdsSkeleton />;

  // Empty State (On ne rend rien si pas de pubs)
  if (!ads || ads.length === 0) return null;

  return (
    <section className="relative py-12 border-t border-white/5 bg-zinc-950/50" aria-labelledby="ads-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Discret */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h2
            id="ads-title"
            className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2"
          >
            <Sparkles size={12} className="text-amber-500" />
            Sélection Partenaires
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {ads.slice(0, 3).map((ad) => (
            <a
              key={ad.id}
              href={ad.lien || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAdClick(ad.id)}
              className="group relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-900 shadow-lg transition-all hover:border-[#00FF00]/30 hover:shadow-[0_0_30px_rgba(0,255,0,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00]"
            >
              {/* Image avec Zoom Effect */}
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                <Image
                  src={mediaUrl(ad.image ?? ad.fichier)}
                  alt={ad.titre || "Offre partenaire"}
                  fill
                  className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              {/* Gradient Overlay pour lisibilité */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-40" />

              {/* Badge "Sponsorisé" */}
              <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/40 backdrop-blur border border-white/10 text-[10px] font-medium text-white/70 uppercase tracking-wide">
                Sponsorisé
              </div>

              {/* Contenu au survol (CTA) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex items-center gap-2 rounded-full bg-[#00FF00] px-4 py-2 text-sm font-bold text-black shadow-xl transform translate-y-4 transition-transform group-hover:translate-y-0">
                  <span>Voir l'offre</span>
                  <ExternalLink size={14} />
                </div>
              </div>

              {/* Titre (si disponible) en bas */}
              {ad.titre && (
                <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform group-hover:-translate-y-2">
                  <h3 className="text-white font-semibold text-lg drop-shadow-md line-clamp-1">
                    {ad.titre}
                  </h3>
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// Composant de chargement pour éviter le saut d'interface
function AdsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8 opacity-50">
        <div className="h-px flex-1 bg-white/10" />
        <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[16/9] w-full rounded-2xl bg-white/5 animate-pulse border border-white/5" />
        ))}
      </div>
    </div>
  );
}