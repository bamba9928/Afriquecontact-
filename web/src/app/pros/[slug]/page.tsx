"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api"; // On fera un call direct ou via pros.api
import { mediaUrl } from "@/lib/media-url";
import { Loader2, MapPin, Briefcase, Phone, MessageCircle, Star, FileText, PlayCircle, Image as ImageIcon } from "lucide-react";

// Ajouter cette fonction dans pros.api.ts idéalement
async function getProBySlug(slug: string) {
  const { data } = await api.get(`/api/pros/public/${slug}/`);
  // NB: Assurez-vous que votre backend a une route qui accepte le slug ou l'ID
  // Si backend utilise ID, changez le nom du dossier [slug] en [id] et usez l'ID
  return data;
}

export default function ProDetailPage() {
  const { slug } = useParams();

  const { data: pro, isLoading } = useQuery({
    queryKey: ["pro-detail", slug],
    queryFn: () => getProBySlug(slug as string),
    enabled: !!slug,
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin"/></div>;
  if (!pro) return <div className="p-10 text-center">Professionnel introuvable.</div>;

  const isPremium = pro.is_contactable;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* HEADER */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-md flex flex-col md:flex-row gap-6">
        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-zinc-800">
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img src={mediaUrl(pro.avatar)} alt="Avatar" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 space-y-2">
           <h1 className="text-3xl font-bold text-white">{pro.nom_entreprise}</h1>
           <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
              <span className="flex items-center gap-1"><Briefcase size={14}/> {pro.metier_name}</span>
              <span className="flex items-center gap-1"><MapPin size={14}/> {pro.zone_name}</span>
              {isPremium && <span className="flex items-center gap-1 text-amber-400"><Star size={14}/> Vérifié</span>}
           </div>
           <p className="text-zinc-300 leading-relaxed mt-2">{pro.description || "Aucune description fournie."}</p>
        </div>
      </div>

      {/* ACTIONS CONTACT */}
      <div className="grid grid-cols-2 gap-4">
         {isPremium ? (
           <>
             <a href={`tel:${pro.telephone_appel}`} className="flex items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-black hover:bg-zinc-200">
               <Phone size={20}/> Appeler
             </a>
             <a href={`https://wa.me/${pro.telephone_whatsapp}`} className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-4 font-bold text-white hover:bg-[#20b85c]">
               <MessageCircle size={20}/> WhatsApp
             </a>
           </>
         ) : (
           <div className="col-span-2 rounded-xl bg-white/5 border border-white/10 p-6 text-center text-zinc-500">
             Les contacts de ce professionnel sont masqués (Compte Gratuit).
           </div>
         )}
      </div>

      {/* GALERIE */}
      {pro.medias && pro.medias.length > 0 && (
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-white">Galerie & Réalisations</h2>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pro.medias.map((m: any) => (
                <div key={m.id} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group">
                   {m.type_media === 'VIDEO' ? (
                     <>
                       <video src={mediaUrl(m.fichier)} className="h-full w-full object-cover opacity-80" />
                       <div className="absolute inset-0 flex items-center justify-center"><PlayCircle size={32} className="text-white"/></div>
                     </>
                   ) : m.type_media === 'CV' ? (
                     <a href={mediaUrl(m.fichier)} target="_blank" className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700">
                        <FileText size={32} className="text-zinc-400"/>
                        <span className="text-xs font-bold">Voir CV</span>
                     </a>
                   ) : (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img src={mediaUrl(m.fichier)} alt="Media" className="h-full w-full object-cover transition group-hover:scale-105" />
                   )}
                </div>
              ))}
           </div>
        </section>
      )}
    </main>
  );
}