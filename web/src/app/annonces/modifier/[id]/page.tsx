"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getAnnonceDetail } from "@/lib/annonces.api";
import { Loader2, MapPin, Phone, User, Calendar, Tag } from "lucide-react";

export default function AnnonceDetailPage() {
  const { id } = useParams();

  const { data: annonce, isLoading } = useQuery({
    queryKey: ["annonce-detail", id],
    queryFn: () => getAnnonceDetail(Number(id)),
  });

  if (isLoading) return <div className="flex h-60 items-center justify-center"><Loader2 className="animate-spin"/></div>;
  if (!annonce) return <div className="p-10 text-center">Annonce introuvable.</div>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 md:p-8 space-y-6">

        {/* En-tête */}
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-bold ${annonce.type === 'OFFRE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {annonce.type}
              </span>
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Calendar size={12}/> {new Date(annonce.cree_le!).toLocaleDateString()}
              </span>
           </div>
           <h1 className="text-2xl font-bold text-white">{annonce.titre}</h1>
           <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1"><MapPin size={14}/> {annonce.ville} ({annonce.adresse_precise})</span>
              {annonce.categorie_name && <span className="flex items-center gap-1"><Tag size={14}/> {annonce.categorie_name}</span>}
           </div>
        </div>

        <hr className="border-white/10"/>

        {/* Description */}
        <div className="prose prose-invert prose-sm max-w-none text-zinc-300 whitespace-pre-line">
           {annonce.description}
        </div>

        {/* Contact */}
        <div className="rounded-xl bg-white/5 p-4 flex items-center justify-between border border-white/10">
           <div>
              <div className="text-xs text-zinc-500 uppercase font-bold">Contact</div>
              <div className="text-lg font-mono text-white mt-1">{annonce.telephone}</div>
           </div>
           <a href={`tel:${annonce.telephone}`} className="p-3 bg-white text-black rounded-full hover:bg-zinc-200 transition">
              <Phone size={20} />
           </a>
        </div>

      </div>
    </main>
  );
}