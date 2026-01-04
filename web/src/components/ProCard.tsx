"use client";

import { useRouter } from "next/navigation";
import {
  Phone,
  MapPin,
  Briefcase,
  Heart,
  MessageCircle,
  Star,
  LocateFixed,
  Lock,
  CheckCircle2,
  ArrowUpRight
} from "lucide-react";
import type { ProPublic } from "@/lib/types";
import { mediaUrl } from "@/lib/media-url";
import { clsx } from "clsx";

interface ProCardProps {
  pro: ProPublic;
  isFavorite?: boolean;
  onToggleFavori?: (id: number) => void;
}

export default function ProCard({
  pro,
  isFavorite = false,
  onToggleFavori,
}: ProCardProps) {
  const router = useRouter();

  // Logique : Un pro est "Premium/Contactable" selon vos règles
  const isPremium = !!pro.is_contactable;
  const isOnline = pro.statut_en_ligne === "ONLINE";
  const detailHref = `/pros/${pro.slug || pro.id}`;

  // Image : Fallback élégant si pas d'image
  const rawImage = pro.avatar || (pro.medias && pro.medias.length > 0 ? pro.medias[0].fichier : null);
  const displayImage = mediaUrl(rawImage);

  // --- Handlers ---
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const handleCall = () => {
    if (!pro.telephone_appel) return;
    window.location.href = `tel:${pro.telephone_appel}`;
  };

  const handleWhatsapp = () => {
    if (!pro.telephone_whatsapp) return;
    const phone = pro.telephone_whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
  };

  return (
    <article
      onClick={() => router.push(detailHref)}
      className={clsx(
        "group relative flex flex-col h-full overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer",
        "hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50",
        isPremium
          ? "border-[#00FF00]/20 bg-zinc-900/80 hover:border-[#00FF00]/40"
          : "border-white/5 bg-zinc-900/40 hover:border-white/10 hover:bg-zinc-900/60"
      )}
    >
      {/* --- BACKGROUND GLOW (Premium Only) --- */}
      {isPremium && (
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#00FF00]/5 blur-3xl transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />
      )}

      {/* --- HEADER : STATUS & FAVORIS --- */}
      <div className="flex items-start justify-between p-5 pb-0 relative z-10">
        <div className="flex gap-2">
           {/* Badge Premium */}
           {isPremium && (
            <div className="inline-flex items-center gap-1 rounded-full bg-[#00FF00]/10 border border-[#00FF00]/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#00FF00]">
              <Star size={10} fill="currentColor" />
              <span>Vérifié</span>
            </div>
          )}

          {/* Badge Distance (si dispo) */}
          {typeof pro.distance_km === "number" && (
             <div className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/5 px-2 py-1 text-[10px] font-medium text-zinc-400">
               <LocateFixed size={10} />
               <span>{pro.distance_km < 1 ? "< 1 km" : `${pro.distance_km.toFixed(0)} km`}</span>
             </div>
          )}
        </div>

        {/* Bouton Favori */}
        {onToggleFavori && (
          <button
            onClick={(e) => handleAction(e, () => onToggleFavori(pro.id))}
            className={clsx(
              "rounded-full p-2 transition-all active:scale-90",
              isFavorite ? "text-red-500 bg-red-500/10" : "text-zinc-500 hover:text-white hover:bg-white/10"
            )}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      {/* --- BODY : INFO PRO --- */}
      <div className="flex items-start gap-4 p-5">
        {/* Avatar avec Status Ring */}
        <div className="relative shrink-0">
          <div className={clsx(
            "h-16 w-16 rounded-2xl overflow-hidden border transition-all duration-300",
            isPremium ? "border-[#00FF00]/30 group-hover:border-[#00FF00]" : "border-white/10"
          )}>
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImage}
                alt={pro.nom_entreprise || "Pro"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-500">
                <Briefcase size={24} />
              </div>
            )}
          </div>

          {/* Point En Ligne */}
          <div className={clsx(
            "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-zinc-900 flex items-center justify-center",
            isOnline ? "bg-[#00FF00]" : "bg-zinc-600"
          )}>
            {isOnline && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00FF00] opacity-75" />}
          </div>
        </div>

        {/* Text Info */}
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-lg font-bold text-white group-hover:text-[#00FF00] transition-colors flex items-center gap-2">
            {pro.nom_entreprise || "Professionnel"}
            {isPremium && <CheckCircle2 size={14} className="text-[#00FF00] shrink-0" />}
          </h3>

          <div className="flex items-center gap-2 text-sm text-zinc-300">
             <Briefcase size={12} className="text-zinc-500" />
             <span className="truncate">{pro.metier_name || "Métier inconnu"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-400">
             <MapPin size={12} className="text-zinc-500" />
             <span className="truncate">{pro.zone_name || "Sénégal"}</span>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* --- FOOTER : ACTIONS --- */}
      <div className="p-5 pt-0 mt-2 grid grid-cols-2 gap-3 relative z-20">

        {/* --- CAS PREMIUM : ACTIONS DISPONIBLES --- */}
        {isPremium ? (
          <>
            <button
              onClick={(e) => handleAction(e, handleCall)}
              className="flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-black py-2.5 text-sm font-bold transition-colors shadow-lg shadow-white/5"
            >
              <Phone size={16} />
              Appeler
            </button>

            <button
               onClick={(e) => handleAction(e, handleWhatsapp)}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white py-2.5 text-sm font-semibold transition-colors backdrop-blur-md"
            >
              <MessageCircle size={16} className="text-[#00FF00]" />
              WhatsApp
            </button>
          </>
        ) : (

        /* --- CAS GRATUIT : BLUR & LOCK (TEASER) --- */
          <div className="col-span-2 relative group/lock overflow-hidden rounded-xl bg-zinc-950/50 border border-white/5 p-3">
             {/* Le faux numéro flouté */}
             <div className="flex items-center justify-between text-zinc-500 blur-[3px] select-none">
                <div className="flex gap-2">
                    <div className="h-8 w-20 bg-zinc-800 rounded"></div>
                    <div className="h-8 w-8 bg-zinc-800 rounded"></div>
                </div>
             </div>

             {/* Le bouton overlay */}
             <button
               onClick={(e) => handleAction(e, () => router.push("/pricing"))}
               className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/60 hover:bg-black/50 transition-colors backdrop-blur-[1px]"
             >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider group-hover/lock:scale-105 transition-transform">
                    <Lock size={12} />
                    <span>Voir le numéro</span>
                </div>
             </button>
          </div>
        )}
      </div>

      {/* Lien discret pour le détail complet si non premium */}
      {!isPremium && (
          <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md">
                 <ArrowUpRight size={16} />
              </div>
          </div>
      )}
    </article>
  );
}