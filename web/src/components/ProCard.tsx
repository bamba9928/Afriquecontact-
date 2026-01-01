"use client";

import {
  Phone,
  MapPin,
  Briefcase,
  Heart,
  MessageCircle,
  Star,
  LocateFixed,
  Lock,
} from "lucide-react";
import type { ProPublic } from "@/lib/types";
import { mediaUrl } from "@/lib/media-url";

// Fonction utilitaire pour le masquage visuel
function maskPhone(p?: string | null) {
  if (!p) return "** ** ** **";
  const digits = p.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return digits.slice(0, 2) + " ** ** " + digits.slice(-2);
}

interface ProCardProps {
  pro: ProPublic;
  isFavorite?: boolean;
  onToggleFavori?: (id: number) => void;
}

/**
 * IMPORTANT (HomePage) :
 * Ce composant est compatible avec un wrapper <Link> autour de <ProCard />.
 * Donc : pas de <Link> / <a> internes (évite les <a> imbriqués).
 */
export default function ProCard({
  pro,
  isFavorite = false,
  onToggleFavori,
}: ProCardProps) {
  const isPremium = !!pro.is_contactable;
  const isOnline = pro.statut_en_ligne === "ONLINE";

  // URL détail (SEO : slug, fallback id)
  const detailHref = `/pros/${pro.slug || pro.id}`;

  // Image : avatar, ou première image galerie, ou null
  const rawImage =
    pro.avatar || (pro.medias && pro.medias.length > 0 ? pro.medias[0].fichier : null);
  const displayImage = mediaUrl(rawImage);

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!pro.telephone_appel) return;
    window.location.href = `tel:${pro.telephone_appel}`;
  };

  const handleWhatsapp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!pro.telephone_whatsapp) return;
    const phone = pro.telephone_whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
  };

  const handleDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.assign(detailHref);
  };

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-3xl border p-4",
        "transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/40",
        isPremium
          ? "border-[#00FF00]/20 bg-gradient-to-br from-zinc-900/70 via-zinc-900/50 to-emerald-900/20 hover:border-[#00FF00]/30"
          : "border-white/10 bg-zinc-900/50 hover:border-white/20",
      ].join(" ")}
    >
      {/* Glow overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#00FF00]/10 blur-3xl" />
        <div className="absolute -bottom-16 right-0 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      {/* Ribbon / Badge premium */}
      {isPremium && (
        <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-[#00FF00]/20 bg-black/40 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#00FF00] backdrop-blur">
          <Star size={12} className="fill-[#00FF00]" />
          Vérifié
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="rounded-2xl bg-gradient-to-br from-white/20 to-white/0 p-[1px]">
            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-zinc-800">
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayImage}
                  alt={pro.nom_entreprise || "Professionnel"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-500">
                  <Briefcase size={24} />
                </div>
              )}
            </div>
          </div>

          {/* Online dot */}
          <div
            className={[
              "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-zinc-900",
              isOnline ? "bg-[#00FF00]" : "bg-zinc-500",
            ].join(" ")}
            title={isOnline ? "En ligne" : "Hors ligne"}
          >
            {isOnline && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00FF00]/70 opacity-60" />
            )}
          </div>
        </div>

        {/* Infos */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-lg font-extrabold tracking-tight text-white transition-colors group-hover:text-[#00FF00]">
                {pro.nom_entreprise || `Pro #${pro.id}`}
              </div>

              {/* Badges secondaires */}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {typeof pro.distance_km === "number" && (
                  <div className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    <LocateFixed size={12} />
                    <span>
                      {pro.distance_km < 1 ? "< 1 km" : `${pro.distance_km.toFixed(1)} km`}
                    </span>
                  </div>
                )}

                <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  Contact direct
                </div>
              </div>
            </div>

            {/* Favori */}
            {onToggleFavori && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavori(pro.id);
                }}
                className={[
                  "rounded-full p-2 transition-all",
                  "hover:scale-[1.03] active:scale-[0.98]",
                  isFavorite
                    ? "bg-red-500/10 text-red-500"
                    : "bg-white/0 text-zinc-500 hover:bg-white/10 hover:text-white",
                ].join(" ")}
                title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <Heart size={20} className={isFavorite ? "fill-current" : ""} />
              </button>
            )}
          </div>

          {/* Métier / Zone */}
          <div className="mt-3 space-y-1 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="shrink-0 text-[#00FF00]" />
              <span className="truncate">{pro.metier_name || "Métier non précisé"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0 text-zinc-500" />
              <span className="truncate">{pro.zone_name || "Sénégal"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="relative z-10 mt-5 grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
        {/* APPEL */}
        {isPremium && pro.telephone_appel ? (
          <button
            type="button"
            onClick={handleCall}
            className="flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-extrabold text-black transition-colors hover:bg-zinc-200"
          >
            <Phone size={16} />
            Appeler
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-zinc-500 opacity-70">
            <Lock size={14} />
            <span className="font-semibold tracking-wide">{maskPhone(pro.telephone_appel)}</span>
          </div>
        )}

        {/* WHATSAPP / DETAILS */}
        {isPremium && pro.telephone_whatsapp ? (
          <button
            type="button"
            onClick={handleWhatsapp}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#25D366]/25 bg-[#25D366]/10 py-2.5 text-sm font-extrabold text-[#25D366] transition-colors hover:bg-[#25D366]/20"
          >
            <MessageCircle size={16} />
            WhatsApp
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDetails}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/0 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            Voir détails
          </button>
        )}
      </div>
    </article>
  );
}
