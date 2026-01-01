"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media-url";
import { useAuthStore } from "@/lib/auth.store";
import {
  addFavori,
  removeFavori,
  listFavoris,
  signalerPro
} from "@/lib/pros.api";
import {
  Loader2, MapPin, Briefcase, Phone, MessageCircle,
  Star, FileText, PlayCircle, Image as ImageIcon,
  Heart, Flag, X, Send
} from "lucide-react";
import { toast } from "sonner";

// Fonction helper locale
async function getProBySlug(slug: string) {
  const { data } = await api.get(`/api/pros/public/${slug}/`);
  return data;
}

export default function ProDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  // 1. Récupérer le Pro
  const { data: pro, isLoading } = useQuery({
    queryKey: ["pro-detail", slug],
    queryFn: () => getProBySlug(slug as string),
    enabled: !!slug,
  });

  // 2. Récupérer l'état du favori
  const { data: favIds } = useQuery({
    queryKey: ["favoris-ids"],
    queryFn: async () => {
      if (!token) return new Set<number>();
      const data = await listFavoris({ page: 1, page_size: 100 });
      return new Set((data.results ?? []).map((fav) => fav.professionnel));
    },
    enabled: !!token && !!pro,
  });

  const isFav = pro && favIds ? favIds.has(pro.id) : false;

  // 3. Mutation Favori
  const toggleFavoriMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        toast.error("Veuillez vous connecter");
        router.push("/pro/login");
        throw new Error("Login required");
      }
      if (isFav) return removeFavori(pro.id);
      return addFavori(pro.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoris-ids"] });
      toast.success(isFav ? "Retiré des favoris" : "Ajouté aux favoris");
    },
  });

  // 4. Mutation Signalement
  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Vous devez être connecté pour signaler.");
      if (!reportReason.trim()) throw new Error("Le motif est obligatoire.");

      return signalerPro({
        professionnel: pro.id,
        motif: "AUTRE", // Vous pouvez complexifier avec un select (FRAUDE, HARCELEMENT...)
        description: reportReason
      });
    },
    onSuccess: () => {
      setIsReportModalOpen(false);
      setReportReason("");
      toast.success("Signalement envoyé aux administrateurs.");
    },
    onError: (err: any) => toast.error(err.message || "Erreur lors du signalement"),
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-white"/></div>;
  if (!pro) return <div className="p-10 text-center text-white">Professionnel introuvable.</div>;

  const isPremium = pro.is_contactable;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8 relative">

      {/* HEADER */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-md flex flex-col md:flex-row gap-6 relative">

        {/* Actions Flottantes (Favori / Signaler) */}
        <div className="absolute top-4 right-4 flex gap-2">
           <button
             onClick={() => toggleFavoriMutation.mutate()}
             disabled={toggleFavoriMutation.isPending}
             className="p-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 transition-colors"
           >
             <Heart
               size={20}
               className={isFav ? "fill-red-500 text-red-500" : "text-white"}
             />
           </button>
           <button
             onClick={() => setIsReportModalOpen(true)}
             className="p-2 rounded-full bg-black/40 hover:bg-red-900/40 border border-white/10 transition-colors group"
             title="Signaler ce profil"
           >
             <Flag size={20} className="text-zinc-400 group-hover:text-red-400" />
           </button>
        </div>

        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-zinc-800">
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img src={mediaUrl(pro.avatar)} alt="Avatar" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 space-y-2 pt-2 md:pt-0">
           <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{pro.nom_entreprise}</h1>
              {pro.statut_en_ligne === "ONLINE" && (
                <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" title="En ligne" />
              )}
           </div>

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
             <a href={`tel:${pro.telephone_appel}`} className="flex items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-black hover:bg-zinc-200 transition-colors">
               <Phone size={20}/> Appeler
             </a>
             <a href={`https://wa.me/${pro.telephone_whatsapp}`} className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-4 font-bold text-white hover:bg-[#20b85c] transition-colors">
               <MessageCircle size={20}/> WhatsApp
             </a>
           </>
         ) : (
           <div className="col-span-2 rounded-xl bg-white/5 border border-white/10 p-6 text-center text-zinc-500 flex flex-col items-center gap-2">
             <span className="font-semibold">Contacts masqués</span>
             <span className="text-xs">Ce professionnel utilise la version gratuite.</span>
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
                        <span className="text-xs font-bold text-white">Voir CV</span>
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

      {/* MODALE DE SIGNALEMENT */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Flag className="text-red-500" size={20}/> Signaler ce profil
                 </h3>
                 <button onClick={() => setIsReportModalOpen(false)} className="text-zinc-500 hover:text-white">
                    <X size={20} />
                 </button>
              </div>

              <p className="text-sm text-zinc-400 mb-4">
                 Aidez-nous à garder la plateforme sûre. Pourquoi signalez-vous <strong>{pro.nom_entreprise}</strong> ?
              </p>

              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Ex: Faux numéro, arnaque, contenu inapproprié..."
                className="w-full h-32 rounded-xl bg-black border border-white/10 p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 resize-none mb-4"
              />

              <div className="flex gap-3">
                 <button
                   onClick={() => setIsReportModalOpen(false)}
                   className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/5"
                 >
                    Annuler
                 </button>
                 <button
                   onClick={() => reportMutation.mutate()}
                   disabled={reportMutation.isPending || !reportReason.trim()}
                   className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                    {reportMutation.isPending ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                    Envoyer
                 </button>
              </div>
           </div>
        </div>
      )}
    </main>
  );
}