"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getProBySlug } from "@/lib/pros.api"; // Assurez-vous d'avoir ajouté cette fn dans l'étape précédente
import { mediaUrl } from "@/lib/media-url";
import {
  Phone, MessageCircle, MapPin,
  FileText, PlayCircle, Lock,
  Share2, Heart, CheckCircle2, Clock,
  Briefcase, ArrowLeft, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";

export default function ProDetailsPage() {
  // On récupère le slug depuis l'URL (ex: /pros/plomberie-diop)
  const params = useParams();
  const slug = params.slug as string;

  const [isShareOpen, setIsShareOpen] = useState(false);

  // 1. Fetching Data
  const { data: pro, isLoading, isError } = useQuery({
    queryKey: ["pro-details", slug],
    queryFn: () => getProBySlug(slug),
    retry: 1,
  });

  // --- LOADING STATE (SKELETON) ---
  if (isLoading) return <DetailSkeleton />;

  // --- ERROR STATE ---
  if (isError || !pro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-500">
            <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">Professionnel introuvable</h2>
        <p className="text-zinc-400">Ce profil n'existe pas ou a été supprimé.</p>
        <Link href="/recherche" className="text-[#00FF00] hover:underline">Retour à la recherche</Link>
      </div>
    );
  }

  // Logique Premium
  const isPremium = pro.is_contactable;
  const isOnline = pro.statut_en_ligne === 'ONLINE';

  // Handler Contacts
  const handleContactClick = (type: 'call' | 'whatsapp') => {
    if (!isPremium) {
      toast.error("Contact masqué", {
        description: "Ce professionnel n'a pas activé son profil Pro pour recevoir des appels."
      });
      return;
    }

    if (type === 'call' && pro.telephone_appel) {
        window.location.href = `tel:${pro.telephone_appel}`;
    } else if (type === 'whatsapp' && pro.telephone_whatsapp) {
        const phone = pro.telephone_whatsapp.replace(/\D/g, "");
        window.open(`https://wa.me/${phone}`, '_blank');
    } else {
        toast.error("Numéro non disponible");
    }
  };

  // Handler Partage
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({ title: pro.nom_entreprise, url }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url);
        toast.success("Lien copié dans le presse-papier !");
    }
  };

  return (
    <div className="relative min-h-screen pb-24 md:pb-12">

      {/* --- 1. COVER HERO --- */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden">
        {/* Background flouté généré à partir de l'avatar ou image défaut */}
        <div className="absolute inset-0 bg-zinc-900">
            {pro.avatar && (
                <Image
                    src={mediaUrl(pro.avatar)}
                    alt="Cover"
                    fill
                    className="object-cover opacity-30 blur-2xl scale-110"
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        </div>

        {/* Bouton Retour Flottant */}
        <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20">
            <Link
                href="/recherche"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors text-sm font-medium"
            >
                <ArrowLeft size={16} /> Retour
            </Link>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10 -mt-20">

        {/* --- 2. PROFIL HEADER CARD --- */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">

                {/* AVATAR */}
                <div className="relative shrink-0 mx-auto md:mx-0">
                    <div className="h-32 w-32 md:h-40 md:w-40 rounded-3xl overflow-hidden border-4 border-zinc-950 bg-zinc-800 shadow-xl">
                        {pro.avatar ? (
                            <Image src={mediaUrl(pro.avatar)} alt={pro.nom_entreprise} fill className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-500">
                                <Briefcase size={40} />
                            </div>
                        )}
                    </div>
                    {/* Badge Online */}
                    {isOnline && (
                        <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-zinc-950 rounded-full border border-zinc-800">
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-bold text-white">En ligne</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* INFOS */}
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                             <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                {pro.nom_entreprise}
                            </h1>
                            {isPremium && <CheckCircle2 className="text-[#00FF00]" size={24} fill="currentColor" stroke="black" />}
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 text-sm text-zinc-400">
                            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg text-zinc-200">
                                <Briefcase size={14} className="text-[#00FF00]" />
                                {pro.metier_name}
                            </span>
                            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg">
                                <MapPin size={14} className="text-amber-500" />
                                {pro.zone_name}
                            </span>
                        </div>
                    </div>

                    <p className="text-zinc-300 leading-relaxed text-base max-w-2xl">
                        {pro.description || "Ce professionnel n'a pas encore ajouté de description détaillée."}
                    </p>

                    {/* ACTIONS BAR (Desktop) */}
                    <div className="hidden md:flex items-center gap-3 pt-2">
                        <button
                            onClick={() => handleContactClick('call')}
                            className={clsx(
                                "flex-1 h-12 flex items-center justify-center gap-2 rounded-xl font-bold transition-all shadow-lg",
                                isPremium
                                    ? "bg-white text-black hover:bg-zinc-200 shadow-white/10"
                                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                            )}
                        >
                            {isPremium ? <Phone size={18} /> : <Lock size={18} />}
                            {isPremium ? "Afficher le numéro" : "Contact masqué"}
                        </button>

                        <button
                            onClick={() => handleContactClick('whatsapp')}
                            className={clsx(
                                "flex-1 h-12 flex items-center justify-center gap-2 rounded-xl font-bold transition-all shadow-lg",
                                isPremium
                                    ? "bg-[#25D366] text-white hover:bg-[#20b85c] shadow-[#25D366]/20"
                                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                            )}
                        >
                            {isPremium ? <MessageCircle size={18} /> : <Lock size={18} />}
                            WhatsApp
                        </button>

                        <button onClick={handleShare} className="h-12 w-12 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* --- 3. GALERIE & MEDIA --- */}
        {pro.medias && pro.medias.length > 0 && (
            <div className="mt-8 space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-[#00FF00] rounded-full" />
                    Réalisations & Documents
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Documents (CV) en premier */}
                    {pro.medias.filter((m: any) => m.type_media === 'CV').map((cv: any) => (
                         <a
                            key={cv.id}
                            href={mediaUrl(cv.fichier)}
                            target="_blank"
                            className="col-span-2 flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 transition-colors group"
                        >
                            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <FileText size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white">Curriculum Vitae</div>
                                <div className="text-xs text-zinc-500">Format PDF • Cliquez pour ouvrir</div>
                            </div>
                        </a>
                    ))}

                    {/* Photos & Vidéos */}
                    {pro.medias.filter((m: any) => m.type_media !== 'CV').map((media: any) => (
                        <div
                            key={media.id}
                            className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 group cursor-pointer"
                        >
                            {media.type_media === 'VIDEO' ? (
                                <>
                                    <video src={mediaUrl(media.fichier)} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40">
                                        <PlayCircle size={40} className="text-white drop-shadow-lg" />
                                    </div>
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-bold text-white uppercase">Vidéo</div>
                                </>
                            ) : (
                                <Image
                                    src={mediaUrl(media.fichier)}
                                    alt="Réalisation"
                                    fill
                                    className="object-cover transition duration-500 group-hover:scale-110"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      {/* --- 4. MOBILE STICKY ACTION BAR --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-zinc-950/90 backdrop-blur-lg border-t border-white/10 pb-safe">
        <div className="grid grid-cols-2 gap-3">
             <button
                onClick={() => handleContactClick('call')}
                className={clsx(
                    "flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm shadow-lg",
                    isPremium
                        ? "bg-white text-black active:bg-zinc-200"
                        : "bg-zinc-800 text-zinc-500 border border-white/5 opacity-80"
                )}
            >
                {isPremium ? <Phone size={18} /> : <Lock size={16} />}
                {isPremium ? "Appeler" : "Masqué"}
            </button>
            <button
                onClick={() => handleContactClick('whatsapp')}
                className={clsx(
                    "flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm shadow-lg",
                    isPremium
                        ? "bg-[#25D366] text-white active:bg-[#1eab52]"
                        : "bg-zinc-800 text-zinc-500 border border-white/5 opacity-80"
                )}
            >
                {isPremium ? <MessageCircle size={18} /> : <Lock size={16} />}
                WhatsApp
            </button>
        </div>
      </div>

    </div>
  );
}

// --- SOUS-COMPOSANT : SKELETON ---
function DetailSkeleton() {
    return (
        <div className="min-h-screen bg-zinc-950">
            <div className="h-48 w-full bg-zinc-900 animate-pulse" />
            <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10">
                <div className="rounded-3xl bg-zinc-900 border border-white/5 p-8 h-96 animate-pulse" />
            </div>
        </div>
    )
}