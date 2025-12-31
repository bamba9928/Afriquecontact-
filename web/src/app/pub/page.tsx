"use client";

import { useQuery } from "@tanstack/react-query";
import { getAds, trackAdClick } from "@/lib/ads.api";
import { ExternalLink, Phone, MessageCircle, Volume2, VolumeX, PlayCircle } from "lucide-react";
import { useState, useRef } from "react";

// Helper pour détecter si le fichier est une vidéo
const isVideoFile = (url?: string) => {
  if (!url) return false;
  return /\.(mp4|mov|webm)$/i.test(url);
};

export default function PubPage() {
  const { data: ads, isLoading, isError } = useQuery({
    queryKey: ["ads"],
    queryFn: getAds,
    staleTime: 1000 * 60 * 5 // Cache de 5 minutes pour éviter de spammer le serveur
  });

  const handleAdClick = (id: number) => {
    // Tracking "fire-and-forget"
    trackAdClick(id);
  };

  if (isLoading) return <AdsSkeleton />;

  if (isError) {
    return (
      <div className="flex h-60 items-center justify-center text-zinc-500">
        <div className="text-center">
          <p>Impossible de charger les partenaires.</p>
          <button onClick={() => window.location.reload()} className="text-indigo-400 text-sm mt-2 hover:underline">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">

      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Nos Partenaires</h1>
          <p className="text-zinc-400 text-sm mt-1">Découvrez les offres exclusives de nos sponsors.</p>
        </div>
        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-bold uppercase tracking-wider self-start md:self-center">
          Sponsorisé
        </div>
      </div>

      {(!ads || ads.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
          <p className="text-zinc-500">Aucune publicité active pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad: any) => (
            <AdCard key={ad.id} ad={ad} onTrack={() => handleAdClick(ad.id)} />
          ))}
        </div>
      )}
    </main>
  );
}

// --- Composant Carte Publicité (Extrait pour gérer l'état vidéo individuel) ---

function AdCard({ ad, onTrack }: { ad: any, onTrack: () => void }) {
  const isVideo = isVideoFile(ad.fichier_url);
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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 hover:bg-zinc-900 hover:border-white/20 transition-all shadow-lg hover:shadow-xl">

      {/* Zone Média (Image ou Vidéo) */}
      <div className="relative aspect-video w-full bg-black overflow-hidden">
        {ad.fichier_url ? (
          isVideo ? (
            <div className="relative h-full w-full">
              <video
                ref={videoRef}
                src={ad.fichier_url}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
              {/* Contrôle du son pour la vidéo */}
              <button
                onClick={toggleMute}
                className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition backdrop-blur-sm"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.fichier_url}
              alt={ad.titre}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600 bg-zinc-800">
            <span className="text-xs font-medium uppercase">Média non disponible</span>
          </div>
        )}

        {/* Badge Overlay */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase">
          Pub
        </div>
      </div>

      {/* Contenu & Actions */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2" title={ad.titre}>
          {ad.titre}
        </h3>

        {/* Séparateur flexible */}
        <div className="flex-1"></div>

        <div className="mt-4 space-y-3 pt-4 border-t border-white/5">

          {/* Action Principale : Site Web */}
          {ad.lien_redirection && (
            <a
              href={ad.lien_redirection}
              target="_blank"
              rel="noreferrer"
              onClick={onTrack}
              className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-black hover:bg-indigo-50 transition-colors w-full"
            >
              <ExternalLink size={16} />
              Visiter le site web
            </a>
          )}

          {/* Actions Secondaires : Contacts */}
          {(ad.telephone_appel || ad.telephone_whatsapp) && (
            <div className="grid grid-cols-2 gap-3">
              {ad.telephone_appel && (
                <a
                  href={`tel:${ad.telephone_appel}`}
                  onClick={onTrack}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                  <Phone size={16} />
                  Appeler
                </a>
              )}

              {ad.telephone_whatsapp && (
                <a
                  href={`https://wa.me/${ad.telephone_whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={onTrack}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 py-3 text-sm font-medium hover:bg-[#25D366]/20 transition-colors"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// Skeleton de chargement
function AdsSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div className="flex justify-between items-center pb-6 border-b border-white/5">
         <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
         <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-zinc-900 h-[380px] animate-pulse flex flex-col">
             <div className="h-48 bg-white/5 w-full rounded-t-2xl" />
             <div className="p-5 space-y-4 flex-1">
                <div className="h-6 w-3/4 bg-white/5 rounded" />
                <div className="mt-auto h-10 w-full bg-white/5 rounded-xl" />
             </div>
          </div>
        ))}
      </div>
    </main>
  );
}