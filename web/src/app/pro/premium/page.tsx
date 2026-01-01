"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { useQuery } from "@tanstack/react-query";
import { billingCheckout, billingMe } from "@/lib/billing.api";
import {
  Check, Loader2, Crown, Zap, ShieldCheck,
  CreditCard, Calendar, History
} from "lucide-react";
import { toast } from "sonner";

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

  // Redirection si non connecté
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
    try {
      // On déclenche la création de session paiement côté Django
      const response = await billingCheckout(); // { checkout_url: "...", ... }

      if (response?.checkout_url) {
        toast.loading("Redirection vers Bictorys...");
        // Redirection vers la page de paiement sécurisée
        window.location.href = response.checkout_url;
      } else {
        throw new Error("Lien de paiement manquant.");
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "Erreur lors de l'initialisation du paiement.";
      toast.error(msg);
      setIsCheckingOut(false);
    }
  };

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
      </div>
    );
  }

  // Normalisation des données venant du serializer Django
  const isActive = !!sub?.is_active;
  const daysLeft = sub?.days_left ?? 0;
  const endDate = sub?.end_at;
  // Gestion robuste de last_payment qui peut être null
  const lastPaymentDate = sub?.last_payment ? (sub.last_payment.paid_at || sub.last_payment.created_at) : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-10">

      {/* HEADER */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Abonnement Premium <span className="text-amber-500">Pro</span>
        </h1>
        <p className="text-zinc-400 max-w-lg mx-auto">
          Débloquez toutes les fonctionnalités pour développer votre activité et être contacté directement par vos clients.
        </p>
      </div>

      {/* CARTE DE STATUT ACTUEL */}
      <section className={`relative overflow-hidden rounded-3xl border p-8 transition-all ${
        isActive
          ? "border-emerald-500/30 bg-gradient-to-br from-emerald-900/20 to-black"
          : "border-white/10 bg-zinc-900/50"
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          <div className="flex items-center gap-5">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-lg ${
              isActive ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-zinc-800 text-zinc-500"
            }`}>
              {isActive ? <ShieldCheck size={32} /> : <Zap size={32} />}
            </div>

            <div>
              <div className="flex items-center gap-3">
                 <h2 className="text-xl font-bold text-white">
                    {isActive ? "Abonnement Actif" : "Compte Gratuit (Limité)"}
                 </h2>
                 {isActive && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-black uppercase tracking-wide">
                        Vérifié
                    </span>
                 )}
              </div>

              <div className="mt-1 text-sm text-zinc-400">
                {isActive ? (
                   <span className="flex items-center gap-2">
                      <Calendar size={14}/> Expire le <span className="text-white font-medium">{formatDate(endDate || undefined)}</span> (Reste {daysLeft}j)
                   </span>
                ) : (
                   <span>Vos coordonnées (Téléphone, WhatsApp) sont masquées aux visiteurs.</span>
                )}
              </div>
            </div>
          </div>

          {/* Bouton Action Rapide (si déjà actif mais proche fin) */}
          {isActive && daysLeft < 5 && (
             <button onClick={handlePayment} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-colors">
                Renouveler maintenant
             </button>
          )}
        </div>
      </section>

      {/* OFFRE COMMERCIALE */}
      <div className="grid md:grid-cols-5 gap-8">

          {/* GAUCHE: CARTE PRIX */}
          <div className="md:col-span-3 relative rounded-[32px] border border-amber-500/30 bg-zinc-900 p-1 shadow-2xl shadow-black/50">
             <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent rounded-[32px] pointer-events-none" />

             <div className="relative h-full rounded-[28px] bg-black/80 backdrop-blur-sm p-8 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 text-amber-500 font-bold mb-4 uppercase tracking-wider text-xs">
                        <Crown size={14} /> Offre Pro Standard
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-white">1 000</span>
                        <span className="text-xl font-semibold text-zinc-400">FCFA</span>
                    </div>
                    <div className="text-sm text-zinc-500 mt-2 mb-8">Par mois • Sans engagement</div>

                    <ul className="space-y-4 mb-8">
                        <FeatureItem text="Visibilité totale des contacts (Appel & WhatsApp)" active />
                        <FeatureItem text="Apparition prioritaire dans les recherches" active />
                        <FeatureItem text="Publication d'offres d'emploi illimitée" active />
                        <FeatureItem text="Badge 'En ligne' activable" active />
                        <FeatureItem text="Statistiques de profil (Vues)" active />
                    </ul>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={isCheckingOut}
                    className="w-full group relative flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-white py-4 font-bold text-black transition-all hover:bg-amber-400 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <div className="relative z-10 flex items-center gap-2">
                        {isCheckingOut ? <Loader2 className="animate-spin" /> : <CreditCard size={18} />}
                        {isActive ? "Prolonger mon abonnement" : "Activer mon Pack Pro"}
                    </div>
                </button>
                <div className="text-center text-[10px] text-zinc-600 mt-3">
                    Paiement sécurisé par Bictorys (Wave, Orange Money, Carte)
                </div>
             </div>
          </div>

          {/* DROITE: INFO & HISTORIQUE */}
          <div className="md:col-span-2 space-y-6">

              {/* Carte Info */}
              <div className="rounded-3xl bg-zinc-900/50 p-6 border border-white/5">
                  <h3 className="font-semibold text-white mb-2">Pourquoi payer ?</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                      Sénégal Contacts est une plateforme professionnelle.
                      Votre contribution nous permet de maintenir le service, de vérifier les profils et de faire de la publicité pour vous amener plus de clients.
                  </p>
              </div>

              {/* Historique (Dernier paiement) */}
              {lastPaymentDate && (
                  <div className="rounded-3xl bg-zinc-900/50 p-6 border border-white/5 flex items-start gap-4">
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                          <History size={20} />
                      </div>
                      <div>
                          <h3 className="font-semibold text-white text-sm">Dernier paiement</h3>
                          <p className="text-xs text-zinc-400 mt-1">
                              Effectué le {formatDate(lastPaymentDate as string)}
                          </p>
                          <div className="mt-2 text-xs text-emerald-400 font-medium">
                              • 1000 FCFA (Succès)
                          </div>
                      </div>
                  </div>
              )}

              {/* Support */}
              <div className="rounded-3xl bg-zinc-900/50 p-6 border border-white/5 text-center">
                  <p className="text-xs text-zinc-500 mb-2">Un problème avec votre paiement ?</p>
                  <a href="mailto:support@senegalcontacts.com" className="text-sm font-bold text-white hover:underline">
                      Contacter le support
                  </a>
              </div>
          </div>
      </div>
    </main>
  );
}

// Composant Puce
function FeatureItem({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <li className={`flex items-start gap-3 text-sm ${active ? "text-zinc-200" : "text-zinc-500"}`}>
      <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
          active ? "bg-amber-500 text-black" : "bg-zinc-800"
      }`}>
        <Check size={10} strokeWidth={4} />
      </div>
      {text}
    </li>
  );
}