"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { useQuery } from "@tanstack/react-query";
import { billingCheckout, billingMe } from "@/lib/billing.api";
import {
  Check, Loader2, Crown, Zap, ShieldCheck,
  CreditCard, Calendar, History, ArrowRight, Sparkles, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";

// Utilitaire de formatage de date
const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("fr-SN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function PremiumPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Redirection immédiate si non connecté
  useEffect(() => {
    if (!token) router.replace("/pro/login");
  }, [token, router]);

  const { data: sub, isLoading } = useQuery({
    queryKey: ["billing-me"],
    queryFn: billingMe,
    enabled: !!token,
    retry: 1
  });

  // Gestion du paiement Bictorys
  const handlePayment = async () => {
    setIsCheckingOut(true);
    const toastId = toast.loading("Initialisation du paiement sécurisé...");

    try {
      const response = await billingCheckout();

      if (response?.checkout_url) {
        toast.success("Redirection vers Bictorys...", { id: toastId });
        // Petit délai pour laisser l'utilisateur lire le toast
        setTimeout(() => {
             window.location.href = response.checkout_url;
        }, 800);
      } else {
        throw new Error("Lien de paiement manquant.");
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "Erreur lors de l'initialisation.";
      toast.error(msg, { id: toastId });
      setIsCheckingOut(false);
    }
  };

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#00FF00]" />
        <p className="text-zinc-500 text-sm animate-pulse">Chargement de votre abonnement...</p>
      </div>
    );
  }

  // Normalisation des données
  const isActive = !!sub?.is_active;
  const daysLeft = sub?.days_left ?? 0;
  const endDate = sub?.end_at;
  const lastPaymentDate = sub?.last_payment ? (sub.last_payment.paid_at || sub.last_payment.created_at) : null;

  return (
    <main className="relative mx-auto max-w-5xl px-4 py-12 space-y-12">

      {/* Background Glow */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* --- HEADER --- */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider">
           <Crown size={12} /> Espace Premium
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
          Boostez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">Business</span>
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-lg leading-relaxed">
          Rejoignez les meilleurs professionnels du Sénégal. Visibilité maximale, contacts directs et badge de confiance.
        </p>
      </div>

      {/* --- STATUS CARD (Dashboard) --- */}
      <section className={clsx(
        "relative overflow-hidden rounded-3xl border p-1 transition-all",
        isActive
          ? "border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
          : "border-white/10"
      )}>
        <div className={clsx(
            "rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6",
            isActive ? "bg-emerald-950/20 backdrop-blur-md" : "bg-zinc-900/50 backdrop-blur-md"
        )}>

            <div className="flex items-center gap-6">
                <div className={clsx(
                    "relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl shadow-2xl",
                    isActive ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-black" : "bg-zinc-800 text-zinc-500"
                )}>
                    {isActive ? <ShieldCheck size={40} /> : <Zap size={40} />}
                    {/* Ping animation if active */}
                    {isActive && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 animate-ping" />}
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                        {isActive ? "Abonnement Actif" : "Compte Standard"}
                    </h2>
                    <div className="text-sm text-zinc-400">
                        {isActive ? (
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-2 text-emerald-400 font-medium">
                                    <Check size={14} strokeWidth={3} /> Fonctionnalités Pro débloquées
                                </span>
                                <span className="text-xs opacity-70">
                                    Expire le {formatDate(endDate || undefined)} (Reste {daysLeft} jours)
                                </span>
                            </div>
                        ) : (
                            <span>Passez Pro pour révéler vos numéros aux clients.</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Rapide pour renouvellement anticipé */}
            {isActive && daysLeft < 7 && (
                 <button
                    onClick={handlePayment}
                    className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-900/20"
                 >
                    <History size={16} />
                    Renouveler maintenant
                 </button>
            )}
        </div>
      </section>

      {/* --- PRICING GRID --- */}
      <div className="grid md:grid-cols-5 gap-6 items-start">

          {/* LEFT: THE OFFER (3 cols) */}
          <div className="md:col-span-3 group relative rounded-[32px] bg-zinc-900 border border-amber-500/20 p-8 shadow-2xl shadow-black/50 overflow-hidden">

             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />

             <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-widest text-xs">
                        <Sparkles size={14} /> Offre Recommandée
                    </div>
                    {/* Tag Prix */}
                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-xs font-bold">
                        Mensuel
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                        <span className="text-6xl font-black text-white tracking-tighter">1 000</span>
                        <div className="flex flex-col items-start ml-1">
                            <span className="text-xl font-bold text-zinc-400">FCFA</span>
                            <span className="text-xs text-zinc-500 font-medium">/ mois</span>
                        </div>
                    </div>
                    <p className="mt-4 text-zinc-400 text-sm">
                        Un tarif accessible pour lancer votre activité. Annulation facile, sans frais cachés.
                    </p>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-10 bg-white/5 rounded-2xl p-5 border border-white/5">
                    <FeatureItem text="Numéros (Appel & WhatsApp) visibles" />
                    <FeatureItem text="Badge 'Vérifié' sur votre profil" highlight />
                    <FeatureItem text="Apparition en tête de liste" />
                    <FeatureItem text="Galerie photos illimitée" />
                    <FeatureItem text="Support technique prioritaire" />
                </div>

                {/* CTA Button */}
                <button
                    onClick={handlePayment}
                    disabled={isCheckingOut}
                    className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 p-[1px] shadow-lg shadow-amber-900/20 transition-transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <div className="relative flex items-center justify-center gap-3 bg-black/10 hover:bg-black/0 h-full py-4 px-6 rounded-[11px] transition-colors">
                        {isCheckingOut ? (
                             <Loader2 className="animate-spin text-black" size={20} />
                        ) : (
                             <CreditCard size={20} className="text-black" />
                        )}
                        <span className="font-bold text-black text-lg">
                            {isActive ? "Prolonger mon accès" : "Activer le Pack Pro"}
                        </span>
                    </div>
                </button>

                <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-zinc-500 font-medium uppercase tracking-wide opacity-70">
                    <span>Wave</span>
                    <span>•</span>
                    <span>Orange Money</span>
                    <span>•</span>
                    <span>Free Money</span>
                    <span>•</span>
                    <span>Carte Bancaire</span>
                </div>
             </div>
          </div>

          {/* RIGHT: INFO & HISTORY (2 cols) */}
          <div className="md:col-span-2 space-y-6">

              {/* Trust Box */}
              <div className="rounded-3xl bg-zinc-900/30 p-6 border border-white/5 backdrop-blur-sm">
                  <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center text-white mb-4">
                      <ShieldCheck size={20} />
                  </div>
                  <h3 className="font-bold text-white mb-2">Paiement 100% Sécurisé</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                      Nous utilisons <strong>Bictorys</strong>, le leader du paiement en ligne au Sénégal. Vos données sont chiffrées et aucune information bancaire n'est stockée sur nos serveurs.
                  </p>
              </div>

              {/* History Box */}
              {lastPaymentDate ? (
                  <div className="rounded-3xl bg-zinc-900/30 p-6 border border-white/5 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-white text-sm">Dernière transaction</h3>
                          <History size={16} className="text-zinc-500" />
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                              <Check size={14} strokeWidth={3} />
                          </div>
                          <div>
                              <div className="text-white font-bold text-sm">1 000 FCFA</div>
                              <div className="text-emerald-400 text-xs">{formatDate(lastPaymentDate as string)}</div>
                          </div>
                      </div>
                  </div>
              ) : (
                // Social Proof si pas d'historique
                 <div className="rounded-3xl bg-zinc-900/30 p-6 border border-white/5 backdrop-blur-sm flex items-start gap-4">
                    <div className="mt-1">
                        <AlertCircle size={20} className="text-amber-500" />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-300 italic">
                            "Depuis que je suis passé Pro, je reçois environ 5 appels par semaine pour des chantiers."
                        </p>
                        <p className="text-xs text-zinc-500 mt-2 font-bold uppercase">— Moussa D., Plombier à Dakar</p>
                    </div>
                 </div>
              )}

              {/* Help Link */}
              <div className="text-center pt-2">
                 <a href="mailto:support@senegalcontact.com" className="text-xs text-zinc-500 hover:text-white transition-colors underline underline-offset-4">
                    Besoin d'aide ou d'une facture ?
                 </a>
              </div>
          </div>
      </div>
    </main>
  );
}

// Composant Puce de Liste
function FeatureItem({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={clsx(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          highlight ? "bg-amber-500 text-black" : "bg-white/10 text-zinc-400"
      )}>
        <Check size={12} strokeWidth={3} />
      </div>
      <span className={clsx("text-sm font-medium", highlight ? "text-white" : "text-zinc-300")}>
        {text}
      </span>
    </div>
  );
}