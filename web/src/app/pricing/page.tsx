import { Metadata } from "next";
import { PricingSection } from "@/components/home/PricingSection";

export const metadata: Metadata = {
  title: "Nos Tarifs & Offres Pro | SénégalContact",
  description: "Boostez votre visibilité et recevez plus de clients avec nos offres Pro et Premium vérifiés.",
  openGraph: {
    title: "Devenez un Pro Vérifié | SénégalContact",
    description: "Choisissez le plan adapté à votre activité et commencez à recevoir des appels directs.",
  },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Le padding-top (pt-24) est important pour ne pas que le contenu
        soit caché sous la NavBar fixe (h-16)
      */}
      <div className="pt-24 pb-20">
        <PricingSection />
      </div>
    </main>
  );
}