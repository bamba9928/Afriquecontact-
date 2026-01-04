"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, LayoutDashboard, LogIn } from "lucide-react";
import { useAuthStore } from "@/lib/auth.store";
import { useEffect, useState } from "react";

export function MobileNav() {
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  // Détermine la destination du 4ème onglet (Espace Pro)
  const isConnected = isMounted && !!accessToken;

  const proTab = {
    href: isConnected ? "/dashboard" : "/pro/login",
    label: isConnected ? "Dashboard" : "Espace Pro",
    icon: isConnected ? LayoutDashboard : LogIn,
  };

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
    proTab // Onglet dynamique
  ];

  const isActive = (href: string) => {
    if (href === "/" && pathname !== "/") return false;
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 backdrop-blur-lg md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-center justify-around px-1">
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
              {/* Indicateur visuel avec la couleur BRAND */}
              <div
                className={`rounded-full p-1 transition-all ${
                  active
                    ? "bg-white/10 text-[#00FF00]" // Remplacement de emerald-400
                    : "bg-transparent"
                }`}
              >
                <Icon
                  size={20}
                  className={active ? "fill-[#00FF00]/20" : ""} // Remplacement de fill-emerald-400/20
                />
              </div>

              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}