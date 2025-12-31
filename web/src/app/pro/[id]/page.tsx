"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getProPublicDetails } from "@/lib/pros.api"; // À créer dans l'API
import { Phone, MessageCircle, MapPin, Clock, FileText, Image as ImageIcon, PlayCircle, Lock } from "lucide-react";
import { toast } from "sonner";

export default function ProDetailsPage() {
  const { id } = useParams();

  const { data: pro, isLoading } = useQuery({
    queryKey: ["pro-details", id],
    queryFn: () => getProPublicDetails(Number(id)), // Fonction fetch vers /pro/{id}
  });

  if (isLoading) return <div className="p-10 text-center text-white">Chargement du profil...</div>;
  if (!pro) return <div className="p-10 text-center text-red-400">Professionnel introuvable.</div>;

  // Logique Premium décrite dans le cahier des charges [cite: 571, 733]
  const isPremium = pro.is_contactable;

  const handleContactClick = (type: 'call' | 'whatsapp') => {
    if (!isPremium) {
      toast.error("Ce professionnel n'est pas joignable pour le moment (Abonnement expiré).");
      return;
    }
    // Logique d'ouverture (tel: ou wa.me)
    const val = type === 'call' ? pro.telephone_appel : pro.telephone_whatsapp;
    if (val) window.open(type === 'call' ? `tel:${val}` : `https://wa.me/${val.replace('+', '')}`, '_blank');
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8 text-white">
      {/* En-tête Profil */}
      <div className="rounded-3xl bg-zinc-900/50 border border-white/10 p-6 backdrop-blur-md flex flex-col md:flex-row gap-6 items-start">
        <div className="relative h-32 w-32 shrink-0 rounded-2xl overflow-hidden border-2 border-white/10 bg-zinc-800">
          {pro.avatar ? (
             <Image src={pro.avatar} alt={pro.nom_entreprise} fill className="object-cover" />
          ) : (
             <div className="flex h-full items-center justify-center text-2xl font-bold bg-indigo-600">{pro.nom_entreprise[0]}</div>
          )}
        </div>

        <div className="flex-1 space-y-3">
            <h1 className="text-3xl font-bold">{pro.nom_entreprise}</h1>
            <div className="flex flex-wrap gap-2 text-sm text-zinc-300">
                <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full">{pro.metier_name}</span>
                <span className="flex items-center gap-1"><MapPin size={14}/> {pro.zone_name}</span>
                {pro.statut_en_ligne === 'ONLINE' && (
                    <span className="text-emerald-400 flex items-center gap-1 text-xs px-2 border border-emerald-500/30 rounded-full">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        En ligne
                    </span>
                )}
            </div>
            <p className="text-zinc-400 leading-relaxed">{pro.description || "Aucune description fournie."}</p>
        </div>
      </div>

      {/* Boutons Contacts (Conditionnels Premium) [cite: 691] */}
      <div className="grid grid-cols-2 gap-4">
        <button
            onClick={() => handleContactClick('call')}
            className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all ${isPremium ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
        >
            {isPremium ? <Phone size={20} /> : <Lock size={20} />}
            {isPremium ? "Appeler" : "Non Joignable"}
        </button>

        <button
            onClick={() => handleContactClick('whatsapp')}
            className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all ${isPremium ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
        >
            {isPremium ? <MessageCircle size={20} /> : <Lock size={20} />}
            {isPremium ? "WhatsApp" : "Non Joignable"}
        </button>
      </div>

      {/* Galerie & Médias [cite: 567] */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Galerie & CV</h2>

        {/* CV Section */}
        {pro.medias?.filter((m: any) => m.type_media === 'CV').length > 0 && (
             <div className="flex gap-4">
                {pro.medias.filter((m: any) => m.type_media === 'CV').map((cv: any) => (
                    <a key={cv.id} href={cv.fichier} target="_blank" className="flex items-center gap-3 bg-zinc-800 p-4 rounded-xl hover:bg-zinc-700 transition">
                        <FileText className="text-indigo-400" size={24} />
                        <div>
                            <div className="font-medium">Curriculum Vitae</div>
                            <div className="text-xs text-zinc-500">Cliquez pour voir</div>
                        </div>
                    </a>
                ))}
             </div>
        )}

        {/* Photos & Vidéos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pro.medias?.filter((m: any) => m.type_media !== 'CV').map((media: any) => (
                <div key={media.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-zinc-900 group cursor-pointer">
                    {media.type_media === 'VIDEO' ? (
                        <>
                            <video src={media.fichier} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
                                <PlayCircle size={32} className="text-white opacity-80" />
                            </div>
                        </>
                    ) : (
                        <Image src={media.fichier} alt="Media pro" fill className="object-cover transition group-hover:scale-105" />
                    )}
                </div>
            ))}
        </div>
      </section>
    </main>
  );
}