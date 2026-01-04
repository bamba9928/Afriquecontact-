"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getAnnonceDetail } from "@/lib/annonces.api";
import Link from "next/link";
import {
  Loader2, MapPin, Phone, Calendar, Tag,
  ArrowLeft, Share2, Wallet, AlertTriangle,
  Briefcase, Search, CheckCircle2, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";

// Utils
const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-SN", {
    day: "numeric", month: "long", year: "numeric"
  });
};

const formatMoney = (amount?: number | string) => {
  if (!amount || amount === "0") return "À discuter";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(num);
};

export default function AnnonceDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: annonce, isLoading, isError } = useQuery({
    queryKey: ["annonce-detail", id],
    queryFn: () => getAnnonceDetail(Number(id)),
    retry: 1
  });

  if (isLoading) return <DetailSkeleton />;

  if (isError || !annonce) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-500">
           <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">Annonce introuvable</h2>
        <p className="text-zinc-400">Cette annonce a peut-être été supprimée ou expirée.</p>
        <Link href="/annonces" className="text-[#00FF00] hover:underline">Retour aux annonces</Link>
      </div>
    );
  }

  const isOffre = annonce.type === 'OFFRE';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: annonce.titre,
        text: `Regarde cette annonce sur Sénégal Contact : ${annonce.titre}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  const handleCall = () => {
      window.location.href = `tel:${annonce.telephone}`;
  };

  return (
    <div className="relative min-h-screen pb-24 md:pb-10">
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">

        {/* --- NAVIGATION --- */}
        <Link
            href="/annonces"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium mb-4"
        >
            <ArrowLeft size={16} /> Retour à la liste
        </Link>

        {/* --- CARTE PRINCIPALE --- */}
        <article className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">

            {/* Background Glow */}
            <div className={clsx(
                "absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-20",
                isOffre ? "bg-emerald-500" : "bg-blue-500"
            )} />

            {/* HEADER */}
            <header className="relative z-10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <span className={clsx(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide border",
                        isOffre
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                        {isOffre ? <Briefcase size={12} /> : <Search size={12} />}
                        {isOffre ? "Offre de service" : "Demande de service"}
                    </span>

                    <button onClick={handleShare} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <Share2 size={18} />
                    </button>
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    {annonce.titre}
                </h1>

                {/* META DATA */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-zinc-400 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-zinc-500" />
                        <span className="text-zinc-300">{annonce.ville}</span>
                        {annonce.adresse_precise && <span className="text-zinc-500">({annonce.adresse_precise})</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Tag size={16} className="text-zinc-500" />
                        <span>{annonce.categorie_name || "Divers"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar size={16} className="text-zinc-500" />
                        <span>{formatDate(annonce.cree_le)}</span>
                    </div>
                </div>
            </header>

            {/* PRICE & CONTENT */}
            <div className="relative z-10 mt-6 space-y-6">

                {/* PRIX BLOCK */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                            {isOffre ? "Tarif / Salaire" : "Budget prévu"}
                        </div>
                        <div className="text-xl font-bold text-white">
                            {formatMoney(annonce.prix || annonce.budget)}
                        </div>
                    </div>
                </div>

                {/* DESCRIPTION */}
                <div className="prose prose-invert prose-sm max-w-none text-zinc-300 whitespace-pre-line leading-relaxed">
                    {annonce.description}
                </div>
            </div>
        </article>

        {/* --- SÉCURITÉ & ACTIONS --- */}
        <div className="grid md:grid-cols-5 gap-6">

            {/* Bloc Sécurité (3 cols) */}
            <div className="md:col-span-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 p-5 flex gap-4">
                <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                <div className="space-y-1">
                    <h3 className="text-sm font-bold text-amber-500">Conseils de sécurité</h3>
                    <ul className="text-xs text-amber-200/70 space-y-1 list-disc pl-3">
                        <li>Ne jamais envoyer d'argent avant la prestation.</li>
                        <li>Privilégiez les rencontres dans des lieux publics.</li>
                        <li>Vérifiez l'identité du professionnel si possible.</li>
                    </ul>
                </div>
            </div>

            {/* Actions Desktop (2 cols) - Caché sur mobile car Sticky */}
            <div className="hidden md:flex md:col-span-2 flex-col gap-3">
                 <button
                    onClick={handleCall}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-black hover:bg-zinc-200 transition-colors shadow-lg"
                 >
                    <Phone size={18} />
                    Appeler {annonce.telephone}
                 </button>
                 <a
                    href={`https://wa.me/${annonce.telephone?.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-bold text-white hover:bg-[#20b85c] transition-colors shadow-lg"
                 >
                    <MessageCircle size={18} />
                    Discuter sur WhatsApp
                 </a>
            </div>
        </div>

      </main>

      {/* --- MOBILE STICKY BAR --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-zinc-950/90 backdrop-blur-lg border-t border-white/10 pb-safe">
        <div className="grid grid-cols-[1fr,auto] gap-3">
             <button
                onClick={handleCall}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-black font-bold text-sm shadow-lg active:scale-[0.98] transition-transform"
            >
                <Phone size={18} />
                Appeler
            </button>

            <a
                href={`https://wa.me/${annonce.telephone?.replace(/\D/g, "")}`}
                className="flex items-center justify-center h-full aspect-square rounded-xl bg-[#25D366] text-white shadow-lg active:scale-[0.95] transition-transform"
            >
                <MessageCircle size={24} />
            </a>
        </div>
      </div>

    </div>
  );
}

// --- SKELETON LOADER ---
function DetailSkeleton() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
            <div className="rounded-3xl border border-white/5 bg-zinc-900 p-8 space-y-6">
                <div className="h-6 w-32 bg-zinc-800 rounded-full animate-pulse" />
                <div className="h-8 w-3/4 bg-zinc-800 rounded animate-pulse" />
                <div className="flex gap-4">
                    <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
                </div>
                <hr className="border-white/5" />
                <div className="space-y-3">
                    <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
                    <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-zinc-800 rounded animate-pulse" />
                </div>
            </div>
        </main>
    )
}