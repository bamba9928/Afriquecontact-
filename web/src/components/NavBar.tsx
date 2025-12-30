"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { LayoutDashboard, LogIn, Heart } from "lucide-react"; // Ajout de l'icône Heart si besoin
import { useEffect, useState } from "react";

export default function NavBar() {
  const pathname = usePathname();

  // OPTIMISATION : On sélectionne uniquement le token pour la perf
  const accessToken = useAuthStore((s) => s.accessToken);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // Fonction utilitaire pour savoir si un lien est actif (gère les sous-dossiers)
  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false;
    return pathname.startsWith(path);
  };

  const linkClass = (path: string) =>
    `transition-colors hover:text-white ${
      isActive(path) ? "text-white font-medium" : "text-zinc-400"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <span>Contact<span className="text-emerald-500">Afrique</span></span>
        </Link>

        {/* Navigation Centrale (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link href="/recherche" className={linkClass("/recherche")}>
            Trouver
          </Link>
          <Link href="/annonces" className={linkClass("/annonces")}>
            Annonces
          </Link>

          {/* ✅ AJOUT DU LIEN FAVORIS / CONTACTS */}
          <Link href="/contacts" className={linkClass("/contacts")}>
            Mes Contacts
          </Link>

          <Link href="/pub" className={linkClass("/pub")}>
            Espace Pub
          </Link>
        </nav>

        {/* Zone Droite : Authentification */}
        <div className="flex items-center gap-4">
          {isMounted && accessToken ? (
            // CAS 1 : Connecté -> Vers Dashboard
            <Link
              href="/pro/dashboard"
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 hover:border-emerald-500/50 transition-all"
            >
              <LayoutDashboard size={16} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
              <span>Mon Espace</span>
            </Link>
          ) : (
            // CAS 2 : Visiteur -> Vers Login
            <Link
              href="/pro/login"
              className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Espace Pro</span>
              <span className="sm:hidden">Pro</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}