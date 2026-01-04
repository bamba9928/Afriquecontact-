"use client";

import { useRouter } from "next/navigation";
import { Search, ArrowRight, Sparkles, MapPin, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function HeroSection() {
  const router = useRouter();
  const tags = ["Plombier", "Électricien", "Menuisier", "Climatisation"];

  // Variantes d'animation pour orchestrer l'apparition
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Délai entre chaque enfant
        delayChildren: 0.2,    // Délai initial global
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" }, // Départ: invisible, plus bas, flou
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: "easeOut" }
    },
  };

  return (
    <section className="relative overflow-hidden pt-20 pb-20 md:pt-32 md:pb-32" aria-labelledby="hero-title">

      {/* --- BACKGROUND (Statique pour la performance) --- */}
      <div className="absolute inset-0 -z-10 bg-zinc-950 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Glow animé subtilement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl"
        >
            <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#00FF00] to-emerald-400 opacity-30"
                 style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
            />
        </motion.div>

        <div className="absolute inset-0 bg-zinc-950/40 bg-[radial-gradient(ellipse_at_center,transparent_20%,#09090b_80%)]" />
      </div>

      <motion.div
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* --- BADGE TOP --- */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] py-1.5 px-4 mb-8 shadow-lg backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-[#00FF00] animate-pulse"></span>
            <span className="text-xs font-medium text-zinc-300 tracking-wide uppercase">La plateforme N°1 au Sénégal</span>
          </div>
        </motion.div>

        {/* --- TITRE --- */}
        <motion.h1 variants={itemVariants} id="hero-title" className="mx-auto max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
          Trouvez le bon <br className="hidden md:block" />
          <span className="relative inline-block whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#00FF00] to-amber-200">
             Professionnel
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#00FF00]/40 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
               <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
          </span>
          <span className="block mt-2 text-2xl sm:text-4xl lg:text-5xl font-bold text-zinc-400">
            pour tous vos projets.
          </span>
        </motion.h1>

        <motion.p variants={itemVariants} className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 leading-relaxed">
          Accédez à un réseau vérifié d'experts à Dakar et partout au Sénégal.
          <span className="text-zinc-200 font-medium"> Simple, rapide et sécurisé.</span>
        </motion.p>


        {/* --- BARRE DE RECHERCHE PRINCIPALE --- */}
        <motion.div variants={itemVariants} className="mx-auto mt-10 max-w-3xl relative group z-20">
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-[#00FF00]/30 via-emerald-500/30 to-amber-500/30 blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

          <button
            onClick={() => router.push("/recherche")}
            className="relative w-full flex items-center bg-zinc-900/90 border border-white/10 backdrop-blur-xl rounded-[1.8rem] p-2 pr-3 shadow-2xl transition-all active:scale-[0.99] group-hover:border-white/20"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-[#00FF00] ml-1">
              <Search className="h-6 w-6" />
            </div>

            <div className="flex-1 text-left px-4">
              <div className="text-zinc-500 text-xs font-semibold tracking-wider uppercase mb-0.5">Je recherche un...</div>
              <div className="text-white font-medium text-lg">Plombier, Mécanicien, Couturier...</div>
            </div>

            <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-[#00FF00] text-black shadow-[0_0_20px_rgba(0,255,0,0.3)] group-hover:shadow-[0_0_30px_rgba(0,255,0,0.5)] transition-all">
              <ArrowRight className="h-5 w-5" />
            </div>
          </button>
        </motion.div>

        {/* --- TAGS --- */}
        <motion.div variants={itemVariants} className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="text-sm text-zinc-500 py-1.5">Populaire :</span>
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/recherche?q=${tag}`}
              className="px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/10 text-sm text-zinc-300 transition-colors cursor-pointer"
            >
              {tag}
            </Link>
          ))}
        </motion.div>

        {/* --- CARDS BENTO GRID --- */}
        <motion.div
          variants={itemVariants}
          className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto"
        >
            {[
              {
                href: "/annonces",
                title: "Publier une demande",
                desc: "Recevez des devis rapidement.",
                icon: Sparkles,
                color: "emerald"
              },
              {
                href: "/pro/register",
                title: "Inscrire mon activité",
                desc: "Trouvez de nouveaux clients.",
                icon: CheckCircle2,
                color: "amber"
              },
              {
                href: "#pricing-title",
                title: "Explorer les offres",
                desc: "Solutions pour professionnels.",
                icon: ArrowRight,
                color: "white"
              }
            ].map((card, idx) => (
              <Link
                key={idx}
                href={card.href}
                className={`group relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-white/5 p-6 transition-all hover:bg-zinc-800/50 hover:border-${card.color === 'white' ? 'white' : card.color + '-500'}/30`}
              >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <card.icon className={`w-16 h-16 text-${card.color === 'white' ? 'white' : card.color + '-500'}`} />
                  </div>
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left h-full justify-between">
                      <div className={`p-2 rounded-lg bg-${card.color === 'white' ? 'white' : card.color + '-500'}/10 text-${card.color === 'white' ? 'white' : card.color + '-400'} mb-3`}>
                          <card.icon size={20} />
                      </div>
                      <div>
                          <h3 className="text-white font-semibold text-lg">{card.title}</h3>
                          <p className="text-zinc-400 text-sm mt-1">{card.desc}</p>
                      </div>
                  </div>
              </Link>
            ))}
        </motion.div>

        {/* --- FOOTER --- */}
        <motion.div variants={itemVariants} className="mt-12 border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#00FF00]" />
                <span>Identités vérifiées</span>
            </div>
            <div className="hidden sm:block h-1 w-1 rounded-full bg-zinc-800" />
            <div className="flex items-center gap-2">
                 <CheckCircle2 size={16} className="text-[#00FF00]" />
                <span>Paiement sécurisé</span>
            </div>
            <div className="hidden sm:block h-1 w-1 rounded-full bg-zinc-800" />
            <div className="flex items-center gap-2">
                 <MapPin size={16} className="text-[#00FF00]" />
                <span>Disponible dans 14 régions</span>
            </div>
        </motion.div>

      </motion.div>
    </section>
  );
}