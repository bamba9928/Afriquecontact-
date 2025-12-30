"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, User, LayoutDashboard } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  // Liste des onglets pour une gestion plus propre
  const tabs = [
    {
      href: "/",
      label: "Accueil",
      icon: Home
    },
    {
      href: "/recherche",
      label: "Trouver",
      icon: Search
    },
    {
      href: "/contacts",
      label: "Contacts",
      icon: Heart
    },
    {
      // Je recommande /pro/dashboard ou /pro/login comme point d'entrée
      href: "/pro/dashboard",
      label: "Espace Pro",
      icon: LayoutDashboard // Plus représentatif que User pour un dashboard
    },
  ];

  // Logique pour savoir si un onglet est actif (gère les sous-dossiers)
  const isActive = (href: string) => {
    if (href === "/" && pathname !== "/") return false;
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 backdrop-blur-lg md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`group flex w-full flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium transition-colors ${
                active
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {/* Indicateur visuel (ligne ou glow) pour l'actif */}
              <div
                className={`mb-1 rounded-full p-1 transition-all ${
                  active
                    ? "bg-white/10 text-emerald-400" // Touche de couleur "Pro"
                    : "bg-transparent"
                }`}
              >
                <Icon size={20} className={active ? "fill-emerald-400/20" : ""} />
              </div>

              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}