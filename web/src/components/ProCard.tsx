"use client";

import Link from "next/link";
import { Phone, MapPin, Briefcase, Heart, MessageCircle, Star, ShieldCheck } from "lucide-react";
import type { ProPublic } from "@/lib/types";

// Fonction utilitaire pour le masquage
function maskPhone(p?: string | null) {
  if (!p) return "Non renseigné";
  const digits = p.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return digits.slice(0, 2) + "******" + digits.slice(-2);
}

interface ProCardProps {
  pro: ProPublic;
  isFavorite?: boolean;
  onToggleFavori?: (id: number) => void;
}

export default function ProCard({ pro, isFavorite = false, onToggleFavori }: ProCardProps) {
  // CORRECTION 1 : Utilisation de 'is_contactable' qui vient du backend (paiement OK)
  // au lieu de deviner 'is_premium'.
  const isPremium = pro.is_contactable;

  // CORRECTION 2 : Utilisation directe du slug racine
  const detailHref = `/pro/${pro.slug}`;

  // CORRECTION 3 : Fallback pour l'image (avatar ou placeholder)
  const displayImage = pro.avatar || pro.photo_couverture;

  return (
    <article className={`group relative flex flex-col gap-4 rounded-2xl border p-4 transition-all hover:border-white/20 ${
      isPremium
        ? "border-amber-500/30 bg-gradient-to-br from-white/5 to-amber-500/5"
        : "border-white/10 bg-white/5"
    }`}>

      {/* HEADER : Photo + Infos principales + Cœur */}
      <div className="flex items-start gap-4">

        {/* Photo ou Initiale */}
        <Link href={detailHref} className="shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-xl bg-zinc-800 border border-white/10">
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImage}
                alt={pro.nom_entreprise || "Pro"}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-500">
                <Briefcase size={24} />
              </div>
            )}
          </div>
        </Link>

        {/* Info Colonne */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={detailHref} className="block truncate font-semibold text-lg text-white hover:underline decoration-white/30 underline-offset-4">
                {/* CORRECTION 4 : 'nom_entreprise' (backend) au lieu de 'nom_commercial' */}
                {pro.nom_entreprise || `Pro #${pro.id}`}
              </Link>

              {/* Badge Premium */}
              {isPremium && (
                <div className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-400">
                  <Star size={12} className="fill-amber-400" />
                  <span>Vérifié & Actif</span>
                </div>
              )}
            </div>

            {/* Bouton Cœur */}
            {onToggleFavori && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onToggleFavori(pro.id);
                }}
                className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-red-400 transition-colors"
                title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
              </button>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-1 text-sm text-zinc-400">
            {/* CORRECTION 5 : Champs aplatis 'metier_name' et 'zone_name' */}
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="shrink-0" />
              <span className="truncate">{pro.metier_name || "Activité non précisée"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">{pro.zone_name || "Localisation inconnue"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER : Actions (Boutons) */}
      <div className="mt-auto grid grid-cols-2 gap-3 pt-2 border-t border-white/5">

        {/* Bouton Appeler */}
        {isPremium && pro.telephone_appel ? (
          <a
            href={`tel:${pro.telephone_appel}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
          >
            <Phone size={16} />
            Appeler
          </a>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-zinc-500 cursor-not-allowed">
            <Phone size={16} />
            {/* Le backend renvoie null si pas premium, mais on gère le cas visuel */}
            {pro.telephone_appel ? maskPhone(pro.telephone_appel) : "*******"}
          </div>
        )}

        {/* Bouton WhatsApp */}
        {isPremium && pro.telephone_whatsapp ? (
          <a
            href={`https://wa.me/${pro.telephone_whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
              "Bonjour, je vous ai vu sur Senegal Contacts."
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 py-2.5 text-sm font-semibold hover:bg-[#25D366]/20 transition-colors"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
        ) : (
           <Link
             href={detailHref}
             className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white hover:bg-white/5 transition-colors"
           >
             Voir profil
           </Link>
        )}
      </div>
    </article>
  );
}