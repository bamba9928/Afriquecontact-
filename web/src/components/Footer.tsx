"use client";

import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  ArrowRight,
  Send,
  MapPin,
  Phone,
  ShieldCheck,
  Globe,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-zinc-950 pt-20 pb-10 border-t border-white/5">
      {/* --- BACKGROUND AMBIANCE --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         {/* Grille subtile */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
        {/* Glow Vert bas de page */}
        <div className="absolute bottom-0 left-1/4 h-64 w-96 rounded-full bg-[#00FF00]/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* --- TOP SECTION: NEWSLETTER & BRAND --- */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16 items-start">
            <div>
                <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black tracking-tighter text-white mb-6">
                    Sénégal<span className="text-[#00FF00]">Contact</span>
                </Link>
                <p className="text-zinc-400 max-w-md text-lg leading-relaxed">
                    La plateforme de référence pour connecter les meilleurs artisans et entreprises avec les clients sénégalais.
                    <span className="text-zinc-200 font-medium"> Fiabilité, Rapidité, Proximité.</span>
                </p>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
                <h3 className="text-white font-bold text-lg mb-2">Restez informé des opportunités</h3>
                <p className="text-zinc-500 text-sm mb-4">Recevez les meilleures annonces et conseils pro chaque semaine.</p>
                <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder="votre@email.com"
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF00]/50 focus:ring-1 focus:ring-[#00FF00]/50 transition-all"
                    />
                    <button
                        type="submit"
                        className="bg-[#00FF00] hover:bg-[#00dd00] text-black px-5 rounded-xl font-bold transition-colors flex items-center justify-center"
                        aria-label="S'inscrire"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>

        {/* --- MIDDLE SECTION: LINKS GRID --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-t border-white/5">

            {/* Colonne 1 */}
            <div>
                <h4 className="text-white font-bold mb-6">Plateforme</h4>
                <ul className="space-y-4">
                    <FooterLink href="/recherche">Trouver un artisan</FooterLink>
                    <FooterLink href="/annonces">Voir les annonces</FooterLink>
                    <FooterLink href="/pricing">Tarifs Pro</FooterLink>
                    <FooterLink href="/mobile">Application Mobile</FooterLink>
                </ul>
            </div>

            {/* Colonne 2 */}
            <div>
                <h4 className="text-white font-bold mb-6">Entreprise</h4>
                <ul className="space-y-4">
                    <FooterLink href="/about">À propos</FooterLink>
                    <FooterLink href="/blog">Blog & Conseils</FooterLink>
                    <FooterLink href="/careers">Recrutement</FooterLink>
                    <FooterLink href="/presse">Presse</FooterLink>
                </ul>
            </div>

            {/* Colonne 3 */}
            <div>
                <h4 className="text-white font-bold mb-6">Support</h4>
                <ul className="space-y-4">
                    <FooterLink href="/help">Centre d'aide</FooterLink>
                    <FooterLink href="/legal">Mentions légales</FooterLink>
                    <FooterLink href="/privacy">Confidentialité</FooterLink>
                    <FooterLink href="/contact">Nous contacter</FooterLink>
                </ul>
            </div>

            {/* Colonne 4: Contact Rapide */}
            <div>
                 <h4 className="text-white font-bold mb-6">Nous trouver</h4>
                 <ul className="space-y-4 text-sm text-zinc-400">
                    <li className="flex items-start gap-3">
                        <MapPin size={18} className="text-[#00FF00] shrink-0 mt-0.5" />
                        <span>km14 Rte de Rufisque<br/>Dakar, Sénégal</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <Phone size={18} className="text-[#00FF00] shrink-0" />
                        <a href="tel:+221770000000" className="hover:text-white transition-colors">+221 77 000 00 00</a>
                    </li>
                    <li className="flex items-center gap-3">
                        <Mail size={18} className="text-[#00FF00] shrink-0" />
                        <a href="mailto:hello@senegalcontact.com" className="hover:text-white transition-colors">hello@senegalcontact.com</a>
                    </li>
                 </ul>
            </div>
        </div>

        {/* --- BOTTOM SECTION: COPYRIGHT & SOCIALS --- */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">

            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 text-[12px] leading-relaxed text-zinc-400">
      {/* Left */}
      <span className="font-medium text-zinc-300/90">
        &copy; {currentYear} <span className="text-white/90">SenContact Pro</span>.
      </span>

      {/* Dot separator (desktop) */}
      <span className="hidden md:block h-1 w-1 rounded-full bg-zinc-700" />

      {/* Security pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur">
        <ShieldCheck size={14} className="text-[#00FF00]" />
        <span className="text-zinc-300/90">
          Paiements sécurisés <span className="text-zinc-500">(Wave / Orange Money / Carte Bancaire)</span>
        </span>
      </div>
    </div>


            {/* Social Icons */}
            <div className="flex gap-4">
                <SocialIcon href="#" icon={Facebook} />
                <SocialIcon href="#" icon={Twitter} />
                <SocialIcon href="#" icon={Instagram} />
                <SocialIcon href="#" icon={Linkedin} />
            </div>
        </div>
      </div>
    </footer>
  );
}

// Composant Lien avec effet de slide
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-2 text-sm text-zinc-400 hover:text-[#00FF00] transition-colors"
      >
        <span className="h-px w-0 bg-[#00FF00] transition-all group-hover:w-2" />
        <span className="transition-transform group-hover:translate-x-1">{children}</span>
      </Link>
    </li>
  );
}

// Composant Icone Sociale
function SocialIcon({ href, icon: Icon }: { href: string; icon: any }) {
    return (
        <a
            href={href}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white hover:scale-110 transition-all border border-transparent hover:border-white/10"
        >
            <Icon size={18} />
        </a>
    )
}