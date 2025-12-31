"use client";

import Link from "next/link";
import {
  Phone,
  MapPin,
  Briefcase,
  Heart,
  MessageCircle,
  Star,
  LocateFixed,
  Lock // ✅ Ajout de l'import manquant
} from "lucide-react";
import type { ProPublic } from "@/lib/types";
import { mediaUrl } from "@/lib/media-url"; // ✅ Utilisation de l'utilitaire d'image

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

export default function ProCard({ pro, isFavorite = false, onToggleFavori }: ProCardProps) {
  const isPremium = pro.is_contactable;

  // Utilisation du slug pour le SEO, fallback sur ID
  const detailHref = `/pros/${pro.slug || pro.id}`;

  // Image : Avatar, ou première image de la galerie, ou null
  const rawImage = pro.avatar || (pro.medias && pro.medias.length > 0 ? pro.medias[0].fichier : null);
  // ✅ Correction URL image (gestion relative/absolue)
  const displayImage = mediaUrl(rawImage);

  const isOnline = pro.statut_en_ligne === 'ONLINE';

  return (
    <article className={`group relative flex flex-col gap-4 rounded-2xl border p-4 transition-all hover:border-indigo-500/30 hover:shadow-lg ${
      isPremium
        ? "border-amber-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-900/10"
        : "border-white/10 bg-zinc-900/50"
    }`}>

      {/* HEADER : Avatar + Infos */}
      <div className="flex items-start gap-4">

        {/* Avatar avec indicateur de statut */}
        <Link href={detailHref} className="relative shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-xl bg-zinc-800 border border-white/10 ring-2 ring-transparent group-hover:ring-indigo-500/50 transition-all">
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImage}
                alt={pro.nom_entreprise || "Professionnel"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-500 bg-zinc-800">
                <Briefcase size={24} />
              </div>
            )}
          </div>

          {/* Badge Statut En Ligne */}
          <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-zinc-900 flex items-center justify-center ${
             isOnline ? "bg-emerald-500" : "bg-zinc-500"
          }`} title={isOnline ? "En ligne" : "Hors ligne"}>
             {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
          </div>
        </Link>

        {/* Info Colonne */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={detailHref} className="block truncate font-bold text-lg text-white hover:text-indigo-400 transition-colors">
                {pro.nom_entreprise || `Pro #${pro.id}`}
              </Link>

              {/* Badges : Premium / Distance */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {isPremium && (
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    <Star size={10} className="fill-amber-400" />
                    <span>Vérifié</span>
                    </div>
                )}
                {/* Affichage de la distance si disponible (Recherche géolocalisée) */}
                {typeof pro.distance_km === 'number' && (
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <LocateFixed size={10} />
                    <span>{pro.distance_km < 1 ? "< 1 km" : `${pro.distance_km.toFixed(1)} km`}</span>
                    </div>
                )}
              </div>
            </div>

            {/* Bouton Cœur */}
            {onToggleFavori && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavori(pro.id);
                }}
                className={`rounded-full p-2 transition-all ${
                    isFavorite
                    ? "text-red-500 bg-red-500/10"
                    : "text-zinc-500 hover:bg-white/10 hover:text-white"
                }`}
                title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <Heart size={20} className={isFavorite ? "fill-current" : ""} />
              </button>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-1 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="shrink-0 text-indigo-400" />
              <span className="truncate">{pro.metier_name || "Métier non précisé"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0 text-zinc-500" />
              <span className="truncate">{pro.zone_name || "Sénégal"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER : Actions */}
      <div className="mt-auto grid grid-cols-2 gap-3 pt-3 border-t border-white/5">

        {/* APPEL */}
        {isPremium && pro.telephone_appel ? (
          <a
            href={`tel:${pro.telephone_appel}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold text-black hover:bg-zinc-200 transition-colors"
          >
            <Phone size={16} /> Appeler
          </a>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 py-2.5 text-sm text-zinc-500 cursor-not-allowed opacity-50">
            <Lock size={14} />
            <span>{maskPhone(pro.telephone_appel)}</span>
          </div>
        )}

        {/* WHATSAPP */}
        {isPremium && pro.telephone_whatsapp ? (
          <a
            href={`https://wa.me/${pro.telephone_whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 py-2.5 text-sm font-bold hover:bg-[#25D366]/20 transition-colors"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        ) : (
           <Link
             href={detailHref}
             className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white hover:bg-white/5 transition-colors"
           >
             Voir détails
           </Link>
        )}
      </div>
    </article>
  );
}