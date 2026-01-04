"use client";

import Link from "next/link";
import { Check, Star, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

const tiers = [
  {
    name: "Gratuit",
    id: "free",
    price: "0 FCFA",
    desc: "Idéal pour tester la plateforme et être visible.",
    features: [
      "Fiche pro basique",
      "Métier + 1 zone géographique",
      "1 photo de profil",
      "Contact masqué (formulaire)",
    ],
    cta: { label: "Créer ma fiche", href: "/pro/register" },
    featured: false,
  },
  {
    name: "Pro",
    id: "pro",
    price: "5 000 FCFA",
    period: "/mois",
    desc: "Pour les artisans qui veulent des clients chaque semaine.",
    features: [
      "Contact direct (WhatsApp & Tel)",
      "Galerie photos illimitée",
      "Badge 'Recommandé' ⭐",
      "Priorité dans la recherche",
      "Statistiques de vues",
    ],
    cta: { label: "Devenir Pro", href: "/pro/register?plan=pro" },
    featured: true,
  },
  {
    name: "Business",
    id: "business",
    price: "Sur Devis",
    desc: "Pour les entreprises et réseaux multi-services.",
    features: [
      "Badge 'Vérifié' (Trust) 🛡️",
      "Top placement (1er résultat)",
      "Gestion multi-comptes",
      "Support dédié 24/7",
    ],
    cta: { label: "Contacter l'équipe", href: "/contacts" },
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section className="relative overflow-hidden py-24" aria-labelledby="pricing-title">

      {/* Background Glow derrière la grille */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#00FF00]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* --- HEADER --- */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2
            id="pricing-title"
            className="text-3xl md:text-5xl font-black text-white tracking-tight"
          >
            Investissez dans votre{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF00] to-emerald-400">
              visibilité
            </span>
          </h2>
          <p className="text-lg text-zinc-400">
            Des tarifs adaptés au marché sénégalais. Sans engagement, annulez quand vous voulez.
            <br className="hidden md:block" />
            <span className="text-zinc-200">Rejoignez les 1000+ professionels qui nous font confiance.</span>
          </p>
        </div>

        {/* --- GRILLE DE PRIX --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={clsx(
                "relative flex flex-col p-8 rounded-3xl transition-all duration-300",
                tier.featured
                  ? "bg-zinc-900/80 border border-[#00FF00]/30 shadow-[0_0_40px_rgba(0,255,0,0.1)] md:scale-110 z-10"
                  : "bg-zinc-900/40 border border-white/5 hover:border-white/10 hover:bg-zinc-900/60"
              )}
            >
              {/* Badge Populaire pour le plan Pro */}
              {tier.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-[#00FF00] px-3 py-1 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-green-900/20">
                  <Star size={12} fill="currentColor" />
                  Le plus populaire
                </div>
              )}

              {/* Header Carte */}
              <div className="mb-6">
                <h3 className={clsx("text-lg font-bold", tier.featured ? "text-white" : "text-zinc-200")}>
                  {tier.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white tracking-tight">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-sm font-medium text-zinc-500">
                      {tier.period}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                  {tier.desc}
                </p>
              </div>

              {/* Séparateur */}
              <div className={clsx("h-px w-full mb-6", tier.featured ? "bg-gradient-to-r from-transparent via-[#00FF00]/30 to-transparent" : "bg-white/5")} />

              {/* Liste Features */}
              <ul className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className={clsx(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5",
                      tier.featured ? "bg-[#00FF00] text-black" : "bg-white/10 text-zinc-400"
                    )}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-zinc-300 font-medium">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Bouton CTA */}
              <Link
                href={tier.cta.href}
                className={clsx(
                  "group relative w-full flex items-center justify-center rounded-xl py-3 px-4 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900",
                  tier.featured
                    ? "bg-[#00FF00] text-black hover:bg-[#00FF00]/90 focus:ring-[#00FF00]"
                    : "bg-white/10 text-white hover:bg-white/20 focus:ring-white"
                )}
              >
                {tier.cta.label}
                {tier.featured && <Sparkles size={16} className="ml-2 transition-transform group-hover:rotate-12" />}
              </Link>

              {/* Footer Trust (Paiement) - Uniquement pour les plans payants */}
              {tier.price !== "0 FCFA" && tier.price !== "Sur Devis" && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-medium opacity-80">


                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* --- FAQ LINK / REASSURANCE --- */}
        <div className="mt-16 text-center">
            <p className="text-zinc-500 text-sm">
                Vous avez une question ? <Link href="/contact" className="text-[#00FF00] hover:underline underline-offset-4">Parler à notre équipe support à Dakar.</Link>
            </p>
        </div>
      </div>
    </section>
  );
}