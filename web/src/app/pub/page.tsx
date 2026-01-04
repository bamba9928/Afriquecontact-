"use client";

import { useQuery } from "@tanstack/react-query";
import { getAds, trackAdClick } from "@/lib/ads.api";
import { mediaUrl } from "@/lib/media-url";
import { ExternalLink, Phone, MessageCircle, Volume2, VolumeX, Sparkles, RefreshCcw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { clsx } from "clsx";

// Helper pour détecter si le fichier est une vidéo
const isVideoFile = (url?: string) => {
  if (!url) return false;
  return /\.(mp4|mov|webm)$/i.test(url);
};

export default function PubPage() {
  const { data: ads, isLoading, isError, refetch } = useQuery({
    queryKey: ["ads"],
    queryFn: getAds,
    staleTime: 1000 * 60 * 5 // Cache de 5 minutes
  });

  // Tracking "fire-and-forget"
  const handleAdClick = (id: number) => {
    trackAdClick(id);
  };

  if (isLoading) return <AdsSkeleton />;

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center space-y-4">
         <div className="p-4 rounded-full bg-red-500/10 text-red-500 mb-2">
            <RefreshCcw size={32} />
         </div>
         <h2 className="text-xl font-bold text-white">Oups, une erreur est survenue</h2>
         <p className="text-zinc-500">Impossible de charger les partenaires pour le moment.</p>
         <button
            onClick={() => refetch()}
            className="px-6 py-2 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors"
        >
            Réessayer
         </button>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 space-y-12">

      {/* --- HEADER --- */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-white/10 p-8 md:p-12 text-center">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-[#00FF00]/5 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-4">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-widest">
              <Sparkles size={12} /> Sponsors Officiels
           </div>
           <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Nos Partenaires
           </h1>
           <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Découvrez les entreprises qui soutiennent la communauté Sénégal Contact. Profitez d'offres exclusives et de services de qualité.
           </p>
        </div>
      </div>

      {/* --- GRID --- */}
      {(!ads || ads.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
          <p className="text-zinc-500 font-medium">Aucune campagne publicitaire active pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad: any) => (
            <AdCard key={ad.id} ad={ad} onTrack={() => handleAdClick(ad.id)} />
          ))}
        </div>
      )}
    </main>
  );
}

// --- SOUS-COMPOSANT CARTE (Isolé pour la gestion vidéo) ---

function AdCard({ ad, onTrack }: { ad: any, onTrack: () => void }) {
  const fileUrl = ad.fichier_url || (ad.image ? mediaUrl(ad.image) : null);
  const isVideo = isVideoFile(fileUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <article className="group flex flex-col h-full overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 hover:border-white/10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">

      {/* Zone Média (16/9) */}
      <div className="relative aspect-video w-full bg-black overflow-hidden border-b border-white/5">
        {fileUrl ? (
          isVideo ? (
            <div className="relative h-full w-full">
              <video
                ref={videoRef}
                src={fileUrl}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
              <button
                onClick={toggleMute}
                className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition backdrop-blur-md border border-white/10"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
          ) : (
            <div className="relative h-full w-full">
                <Image
                src={fileUrl}
                alt={ad.titre || "Publicité"}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
                />
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-700 bg-zinc-800">
             <Sparkles size={32} className="opacity-20" />
          </div>
        )}

        {/* Badge Sponsorisé */}
        <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white/80 uppercase tracking-wide border border-white/10">
          Sponsorisé
        </div>
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-[#00FF00] transition-colors" title={ad.titre}>
          {ad.titre || "Partenaire Sénégal Contact"}
        </h3>

        {/* Description courte (optionnelle si dispo dans l'API, sinon on laisse vide pour aérer) */}
        {ad.description && (
             <p className="text-zinc-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                 {ad.description}
             </p>
        )}

        <div className="flex-1" /> {/* Spacer */}

        <div className="space-y-3 pt-4 mt-2">

          {/* Bouton Site Web (Primary) */}
          {ad.lien_redirection && (
            <a
              href={ad.lien_redirection}
              target="_blank"
              rel="noreferrer"
              onClick={onTrack}
              className="flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-black hover:bg-zinc-200 transition-colors w-full shadow-lg shadow-white/5"
            >
              Visiter le site web <ExternalLink size={16} />
            </a>
          )}

          {/* Boutons Contacts (Secondary) */}
          {(ad.telephone_appel || ad.telephone_whatsapp) && (
            <div className="grid grid-cols-2 gap-3">
              {ad.telephone_appel ? (
                <a
                  href={`tel:${ad.telephone_appel}`}
                  onClick={onTrack}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  <Phone size={16} /> Appeler
                </a>
              ) : <div/>}

              {ad.telephone_whatsapp ? (
                <a
                  href={`https://wa.me/${ad.telephone_whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={onTrack}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 py-3 text-sm font-semibold hover:bg-[#25D366]/20 transition-colors"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              ) : <div/>}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// Skeleton Loader
function AdsSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 space-y-12">
      <div className="h-48 w-full bg-zinc-900 rounded-3xl animate-pulse border border-white/5" />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-3xl border border-white/5 bg-zinc-900 h-[420px] animate-pulse flex flex-col overflow-hidden">
             <div className="h-56 bg-white/5 w-full" />
             <div className="p-6 space-y-4 flex-1">
                <div className="h-6 w-3/4 bg-white/5 rounded-lg" />
                <div className="h-4 w-1/2 bg-white/5 rounded-lg" />
                <div className="mt-auto pt-4 space-y-3">
                    <div className="h-12 w-full bg-white/5 rounded-xl" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-10 w-full bg-white/5 rounded-xl" />
                        <div className="h-10 w-full bg-white/5 rounded-xl" />
                    </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </main>
  );
}