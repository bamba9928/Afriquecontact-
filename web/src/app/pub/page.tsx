"use client";

import { useQuery } from "@tanstack/react-query";
import { getAds, trackAdClick } from "@/lib/ads.api"; // Assurez-vous d'avoir exporté trackAdClick
import { ExternalLink, Phone, MessageCircle, Info } from "lucide-react";

export default function PubPage() {
  const { data: ads, isLoading, isError } = useQuery({
    queryKey: ["ads"],
    queryFn: getAds,
    staleTime: 1000 * 60 * 5 // Cache de 5 minutes
  });

  // Gestionnaire de clic (Tracking + Navigation)
  const handleAdClick = (id: number) => {
    trackAdClick(id);
    // Pas besoin de preventDefault, le lien s'ouvrira quand même
  };

  if (isLoading) return <AdsSkeleton />;

  if (isError) {
    return (
      <div className="flex h-60 items-center justify-center text-zinc-500">
        Impossible de charger les publicités.
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Espace Partenaires</h1>
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Sponsorisé
        </span>
      </div>

      {(!ads || ads.length === 0) ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-zinc-500">
          Aucune publicité pour le moment.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => (
            <article
              key={ad.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
            >
              {/* Image avec Ratio 16/9 forcé */}
              <div className="relative aspect-video w-full bg-black/20">
                {ad.fichier_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ad.fichier_url}
                    alt={ad.titre}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-600">
                    <span className="text-sm">Pas d'image</span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold text-white mb-4 line-clamp-1">
                  {ad.titre}
                </h3>

                {/* Grille de boutons en bas */}
                <div className="mt-auto grid gap-2">

                  {/* Bouton Principal : Site Web */}
                  {ad.lien_redirection && (
                    <a
                      href={ad.lien_redirection}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => handleAdClick(ad.id)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
                    >
                      <ExternalLink size={16} />
                      Ouvrir le site
                    </a>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {/* Bouton Appel */}
                    {ad.telephone_appel && (
                      <a
                        href={`tel:${ad.telephone_appel}`}
                        onClick={() => handleAdClick(ad.id)} // On track aussi les appels si on veut
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
                      >
                        <Phone size={16} />
                        Appeler
                      </a>
                    )}

                    {/* Bouton WhatsApp (Vert) */}
                    {ad.telephone_whatsapp && (
                      <a
                        href={`https://wa.me/${ad.telephone_whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleAdClick(ad.id)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 py-2.5 text-sm font-medium hover:bg-[#25D366]/20 transition-colors"
                      >
                        <MessageCircle size={16} />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

// Skeleton pour le chargement
function AdsSkeleton() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="h-8 w-48 rounded-lg bg-white/5 animate-pulse" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-zinc-900 h-[350px] animate-pulse" />
        ))}
      </div>
    </main>
  );
}