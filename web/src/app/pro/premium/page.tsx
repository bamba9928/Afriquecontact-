"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { useQuery } from "@tanstack/react-query";
import { billingCheckout, billingMe } from "@/lib/billing.api";
import { Check, Loader2, Crown, Zap, ShieldCheck, CreditCard } from "lucide-react";
import { toast } from "sonner"; // Ou alert() si pas de toaster

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
    enabled: !!token
  });

  // Gestion du paiement Bictorys [cite: 217, 231]
  const handlePayment = async () => {
    setIsCheckingOut(true);
    try {
      const response = await billingCheckout();

      if (response?.checkout_url) {
        // Redirection vers la page de paiement sécurisée (Bictorys) [cite: 233]
        window.location.href = response.checkout_url;
      } else {
        throw new Error("Pas d'URL de paiement reçue");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'initialisation du paiement. Réessayez.");
      setIsCheckingOut(false);
    }
  };

  if (!token || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  // Normalisation des données API (parfois active, parfois is_active)
  const isActive = !!(sub?.is_active ?? sub?.active);
  const daysLeft = sub?.days_left ?? 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">

      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Abonnement Pro</h1>
        <p className="text-zinc-400">Boostez votre visibilité et recevez plus de clients.</p>
      </div>

      {/* CARTE DE STATUT ACTUEL */}
      <section className={`rounded-2xl border p-6 flex flex-col md:flex-row items-center justify-between gap-4 ${
        isActive
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-white/10 bg-white/5"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isActive ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
          }`}>
            {isActive ? <ShieldCheck size={24} /> : <Zap size={24} />}
          </div>
          <div>
            <div className="font-semibold text-lg text-white">
              Statut : {isActive ? <span className="text-emerald-400">PREMIUM ACTIF</span> : "Compte Gratuit"}
            </div>
            <div className="text-sm text-zinc-400">
              {isActive
                ? `Il vous reste ${daysLeft} jours de visibilité.`
                : "Vos boutons de contact sont masqués."} [cite: 258]
            </div>
          </div>
        </div>

        {isActive && (
          <div className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 border border-emerald-500/20">
            Tout est en ordre
          </div>
        )}
      </section>

      {/* OFFRE COMMERCIALE (Si inactif ou pour prolonger) */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-zinc-900 to-black p-1">
        {/* Effet Glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl"></div>

        <div className="relative rounded-[22px] bg-zinc-900/90 p-6 md:p-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-8">

            {/* Colonne Gauche : Prix */}
            <div className="flex-1 space-y-4 border-b border-white/5 md:border-b-0 md:border-r pr-0 md:pr-8 pb-6 md:pb-0">
              <div className="flex items-center gap-2 text-amber-500 font-medium">
                <Crown size={20} />
                <span>Offre Mensuelle</span>
              </div>
              <div>
                <span className="text-4xl font-bold text-white">1 000 FCFA</span>
                <span className="text-zinc-500"> / mois</span>
              </div>
              <p className="text-sm text-zinc-400">
                Paiement sécurisé via Bictorys (Wave, OM, Carte). Sans engagement.
              </p>

              <button
                onClick={handlePayment}
                disabled={isCheckingOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-black hover:bg-amber-400 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? <Loader2 className="animate-spin" /> : <CreditCard size={18} />}
                {isActive ? "Prolonger l'abonnement" : "Activer maintenant"}
              </button>
            </div>

            {/* Colonne Droite : Avantages */}
            <div className="flex-1 space-y-4 pl-0 md:pl-4">
              <h3 className="font-semibold text-white">Ce que vous obtenez :</h3>
              <ul className="space-y-3">
                <FeatureItem text="Visibilité prioritaire dans les recherches" />
                <FeatureItem text="Boutons 'Appel' & 'WhatsApp' débloqués" />
                <FeatureItem text="Statut 'En Ligne' activable" />
                <FeatureItem text="Badge 'Vérifié' sur votre profil" />
                <FeatureItem text="Statistiques de vues (Bientôt)" />
              </ul>
            </div>

          </div>
        </div>
      </section>

      <div className="text-center text-xs text-zinc-500">
        En payant, vous acceptez nos conditions générales de vente. <br/>
        Le renouvellement est manuel pour vous laisser le contrôle.
      </div>
    </main>
  );
}

// Petit composant pour les listes à puces
function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-zinc-300">
      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
        <Check size={10} strokeWidth={3} />
      </div>
      {text}
    </li>
  );
}