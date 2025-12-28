"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store"; // Assurez-vous du chemin
import { User, LayoutDashboard, LogIn } from "lucide-react";
import { useEffect, useState } from "react";

export default function NavBar() {
  const pathname = usePathname();
  const { accessToken } = useAuthStore();

  // Petite astuce pour éviter les erreurs d'hydratation sur le rendu conditionnel du bouton
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const isActive = (path: string) => pathname === path ? "text-white font-medium" : "text-zinc-400 hover:text-white transition-colors";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Contact<span className="text-emerald-500">Afrique</span>
        </Link>

        {/* Navigation Centrale (Cachée sur très petit mobile) */}
        <nav className="hidden md:flex gap-6 text-sm">
          <Link href="/recherche" className={isActive("/recherche")}>Trouver</Link>
          <Link href="/annonces" className={isActive("/annonces")}>Annonces</Link>
          <Link href="/pub" className={isActive("/pub")}>Espace Pub</Link>
        </nav>

        {/* Zone Droite : Authentification */}
        <div className="flex items-center gap-4">
          {isMounted && accessToken ? (
            // CAS 1 : Connecté -> Vers Dashboard
            <Link
              href="/pro/dashboard"
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 transition-all"
            >
              <LayoutDashboard size={16} className="text-zinc-400 group-hover:text-emerald-400" />
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