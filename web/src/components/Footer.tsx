"use client";

import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-zinc-950 pt-16 pb-8">
      {/* Background premium */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,0,0.12),transparent_55%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:80px_80px]" />
        <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.90)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4">
        {/* Top grid */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* COL 1 : MARQUE */}
          <div className="space-y-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xl font-extrabold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
              aria-label="Retour à l'accueil de Sénégal Contact"
            >
              <span>
                Sénégal
                <span className="text-[#00FF00] drop-shadow-[0_0_18px_rgba(0,255,0,0.25)]">
                  Contact
                </span>
              </span>
            </Link>

            <p className="text-sm text-zinc-400 leading-relaxed">
              La plateforme de référence pour trouver les meilleurs professionnels
              vérifiés au Sénégal. Simple, rapide et fiable.
            </p>

            {/* Mini CTA */}
            <Link
              href="/recherche"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/10 hover:border-[#00FF00]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Trouver un pro <ArrowRight size={14} aria-hidden="true" />
            </Link>

            <nav aria-label="Réseaux sociaux">
              <div className="flex gap-3 pt-1">
                <SocialLink href="#" icon={Facebook} label="Suivez-nous sur Facebook" />
                <SocialLink href="#" icon={Instagram} label="Suivez-nous sur Instagram" />
                <SocialLink href="#" icon={Linkedin} label="Suivez-nous sur LinkedIn" />
                <SocialLink href="#" icon={Twitter} label="Suivez-nous sur Twitter" />
              </div>
            </nav>
          </div>

          {/* COL 2 : NAVIGATION */}
          <nav aria-labelledby="footer-nav-title">
            <h3 id="footer-nav-title" className="text-sm font-extrabold uppercase tracking-widest text-white/90 mb-5">
              Navigation
            </h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li>
                <Link
                  href="/recherche"
                  className="group inline-flex items-center gap-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/25 group-hover:bg-[#00FF00] transition-colors" aria-hidden="true" />
                  Trouver un pro
                </Link>
              </li>
              <li>
                <Link
                  href="/annonces"
                  className="group inline-flex items-center gap-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/25 group-hover:bg-[#00FF00] transition-colors" aria-hidden="true" />
                  Offres d&apos;emploi
                </Link>
              </li>
              <li>
                <Link
                  href="/pro/register"
                  className="group inline-flex items-center gap-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/25 group-hover:bg-[#00FF00] transition-colors" aria-hidden="true" />
                  Inscrire mon entreprise
                </Link>
              </li>
              <li>
                <Link
                  href="/pub"
                  className="group inline-flex items-center gap-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/25 group-hover:bg-[#00FF00] transition-colors" aria-hidden="true" />
                  Devenir partenaire
                </Link>
              </li>
            </ul>
          </nav>

          {/* COL 3 : LÉGAL */}
          <nav aria-labelledby="footer-legal-title">
            <h3 id="footer-legal-title" className="text-sm font-extrabold uppercase tracking-widest text-white/90 mb-5">
              Informations
            </h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li>
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/25 group-hover:bg-amber-400 transition-colors" aria-hidden="true" />
                  À propos de nous
                </Link>
              </li>
              <li>
                <Link
                  href="/mentions-legales"
                  className="group inline-flex items-center gap-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/25 group-hover:bg-amber-400 transition-colors" aria-hidden="true" />
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="group inline-flex items-center gap-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/25 group-hover:bg-amber-400 transition-colors" aria-hidden="true" />
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="group inline-flex items-center gap-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/25 group-hover:bg-amber-400 transition-colors" aria-hidden="true" />
                  Conditions d&apos;utilisation
                </Link>
              </li>
            </ul>
          </nav>

          {/* COL 4 : CONTACT */}
          <div>
            <h3 id="footer-contact-title" className="text-sm font-extrabold uppercase tracking-widest text-white/90 mb-5">
              Contact
            </h3>

            <address className="not-italic">
              <ul className="space-y-4 text-sm text-zinc-400">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#00FF00]" aria-hidden="true">
                    <MapPin size={16} />
                  </div>
                  <span className="leading-relaxed">
                    km14 Rte de Rufisque
                    <br />
                    Dakar, Sénégal
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#00FF00]" aria-hidden="true">
                    <Phone size={16} />
                  </div>
                  <a
                    href="tel:+221338948723"
                    className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                    aria-label="Appeler le 33 894 87 23"
                  >
                    33 894 87 23
                  </a>
                </li>

                <li className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#00FF00]" aria-hidden="true">
                    <Phone size={16} />
                  </div>
                  <a
                    href="tel:+221780103636"
                    className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                    aria-label="Appeler le 78 010 36 36"
                  >
                    78 010 36 36
                  </a>
                </li>

                <li className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#00FF00]" aria-hidden="true">
                    <Mail size={16} />
                  </div>
                  <a
                    href="mailto:contact@senegalcontacts.com"
                    className="hover:text-white transition-colors break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
                    aria-label="Envoyer un email à contact@senegalcontacts.com"
                  >
                    contact@senegalcontacts.com
                  </a>
                </li>
              </ul>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>
            &copy; {currentYear} Sénégal Contact. Tous droits réservés.
          </p>

          <div className="flex items-center gap-2 rounded-full border border-[#00FF00]/15 bg-[#00FF00]/5 px-3 py-1.5 text-[#00FF00]/90">
            <ShieldCheck size={12} aria-hidden="true" />
            <span className="font-semibold">Plateforme Sécurisée</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00FF00]/30 hover:bg-[#00FF00]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
    >
      <Icon size={18} />
      <span className="pointer-events-none absolute inset-0 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100 bg-[#00FF00]/10 rounded-2xl" aria-hidden="true" />
    </a>
  );
}