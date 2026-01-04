"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { LayoutDashboard, LogIn, Menu, X, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NavBar() {
  const pathname = usePathname();
  const { accessToken, user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  useEffect(() => setIsMounted(true), []);

  // Empêcher le scroll quand le menu mobile est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const navItems = [
    { path: "/recherche", label: "Trouver un Pro" },
    { path: "/annonces", label: "Annonces" },
    { path: "/contacts", label: "Mes Contacts" },
    { path: "/pub", label: "Partenaires" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false;
    return pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* --- LOGO --- */}
          <Link href="/" className="group flex items-center gap-2 z-50 relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#00FF00] to-emerald-500 text-black shadow-[0_0_15px_rgba(0,255,0,0.3)] group-hover:shadow-[0_0_25px_rgba(0,255,0,0.5)] transition-all duration-300">
              <span className="font-bold text-lg leading-none">S</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Sénégal<span className="text-[#00FF00]">Contact</span>
            </span>
          </Link>

          {/* --- DESKTOP NAVIGATION (Interactive) --- */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  onMouseEnter={() => setHoveredPath(item.path)}
                  onMouseLeave={() => setHoveredPath(null)}
                >
                  {/* Effet de fond au survol (Hover Pill) */}
                  {hoveredPath === item.path && (
                    <motion.div
                      layoutId="navbar-hover"
                      className="absolute inset-0 rounded-full bg-white/5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  {/* Indicateur Actif (Petit point vert) */}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]" />
                  )}

                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* --- ACTIONS DROITE --- */}
          <div className="flex items-center gap-4 z-50 relative">
            {isMounted && accessToken ? (
              // Connecté
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:border-[#00FF00]/30 hover:shadow-[0_0_15px_rgba(0,255,0,0.1)]"
              >
                <div className="relative">
                    <LayoutDashboard size={16} className="text-zinc-400 group-hover:text-[#00FF00] transition-colors" />
                    <span className="absolute inset-0 animate-ping rounded-full bg-[#00FF00] opacity-0 group-hover:opacity-20" />
                </div>
                <span className="max-w-[100px] truncate hidden sm:block">
                  {user?.nom_entreprise || "Mon Espace"}
                </span>
              </Link>
            ) : (
              // Non connecté
              <Link
                href="/pro/login"
                className="group relative overflow-hidden flex items-center gap-2 rounded-full bg-white pl-4 pr-5 py-1.5 text-sm font-bold text-black transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                <LogIn size={16} className="transition-transform group-hover:-translate-x-1" />
                <span>Espace Pro</span>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-zinc-300/50 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </Link>
            )}

            {/* Mobile Burger */}
            <button
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* --- MOBILE MENU OVERLAY --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 z-40 bg-zinc-950 border-t border-white/5 md:hidden"
          >
             {/* Background decoration */}
             <div className="absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-[#00FF00]/5 blur-3xl pointer-events-none" />

            <div className="flex flex-col p-6 gap-2">
              {navItems.map((item, idx) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-4 rounded-xl text-lg font-medium transition-all flex items-center justify-between ${
                    isActive(item.path)
                      ? "bg-white/5 text-[#00FF00] border border-white/5"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                  {isActive(item.path) && <Sparkles size={16} />}
                </Link>
              ))}

              {!accessToken && (
                 <div className="mt-4 pt-4 border-t border-white/5">
                     <p className="text-sm text-zinc-500 mb-4 px-2">Professionnels</p>
                     <Link
                        href="/pro/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00FF00] py-3 font-bold text-black"
                     >
                        Créer mon compte Pro
                     </Link>
                 </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}