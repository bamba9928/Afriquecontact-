"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFeaturedJobs } from "@/lib/catalog.api";
import {
  rechercherPros,
  listFavoris,
  addFavori,
  removeFavori
} from "@/lib/pros.api";
import { getAds, trackAdClick } from "@/lib/ads.api";
import { useAuthStore } from "@/lib/auth.store";
import Link from "next/link";
import ProCard from "@/components/ProCard";
import {
  Search, MapPin, Phone, Star, ShieldCheck,
  ArrowRight, Briefcase
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mediaUrl } from "@/lib/media-url";

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  // --- DATA FETCHING ---

  // 1. Jobs (Catégories)
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs-featured"],
    queryFn: getFeaturedJobs,
    staleTime: 1000 * 60 * 30,
  });

  // 2. Pros (Cartes)
  const { data: prosData, isLoading: prosLoading } = useQuery({
    queryKey: ["home-pros"],
    queryFn: () => rechercherPros({ page: 1, page_size: 8 }),
    staleTime: 1000 * 60 * 5,
  });
  const pros = prosData?.results ?? [];

  // 3. Pubs
  const { data: ads } = useQuery({
    queryKey: ["ads-home"],
    queryFn: getAds,
    staleTime: 1000 * 60 * 5,
  });

  // 4. Favoris
  const { data: favIds } = useQuery({
    queryKey: ["favoris-ids"],
    queryFn: async () => {
      if (!token) return new Set<number>();
      const data = await listFavoris({ page: 1, page_size: 100 });
      return new Set((data.results ?? []).map((fav) => fav.professionnel));
    },
    enabled: !!token,
  });

  // --- MUTATIONS ---

  const toggleFavoriMutation = useMutation({
    mutationFn: async (proId: number) => {
      if (!token) {
        router.push("/pro/login");
        throw new Error("Login required");
      }
      const isFav = favIds?.has(proId);
      if (isFav) return removeFavori(proId);
      return addFavori(proId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoris-ids"] });
      queryClient.invalidateQueries({ queryKey: ["favoris"] });
      toast.success("Favoris mis à jour");
    },
    onError: (err: any) => {
      if (err?.message !== "Login required") toast.error("Erreur action favori");
    },
  });

  return (
    <main className="min-h-screen bg-zinc-950 pb-20">

      {/* 1. HÉROS PREMIUM & RECHERCHE CENTRALE */}
      <section
        className="relative overflow-hidden px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center"
        aria-labelledby="hero-title"
      >
        {/* Background premium */}
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          {/* Radial glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,0,0.18),transparent_55%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.12),transparent_55%)]" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:64px_64px]" />
          {/* Orbs */}
          <div className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#00FF00]/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-28 right-10 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl animate-pulse [animation-delay:450ms]" />
          {/* Vignette */}
          <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 backdrop-blur">
              <span
                className="h-2 w-2 rounded-full bg-[#00FF00] shadow-[0_0_18px_rgba(0,255,0,0.75)]"
                aria-label="Statut actif"
              />
              Pros vérifiés • Contact direct • Sans intermédiaire
            </div>

            {/* Title + subtitle */}
            <div className="space-y-4">
              <h1
                id="hero-title"
                className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.05]"
              >
                Trouvez un{" "}
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF00] via-emerald-300 to-amber-200">
                    professionnel
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[6px] rounded-full bg-[#00FF00]/20 blur-sm" aria-hidden="true" />
                </span>
                <br className="hidden md:block" />
                en quelques secondes
              </h1>

              <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
                Vérifiés, notés et disponibles près de chez vous. La référence pour vos
                travaux et services au Sénégal.
              </p>
            </div>

            {/* BARRE DE RECHERCHE PREMIUM */}
            <div className="mx-auto max-w-2xl">
              <div className="group relative">
                {/* Outer glow / gradient ring */}
                <div
                  className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-[#00FF00]/70 via-emerald-400/40 to-amber-400/50 blur-lg opacity-35 transition-opacity duration-300 group-hover:opacity-60 group-focus-within:opacity-80"
                  aria-hidden="true"
                />
                <div
                  className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-[#00FF00]/60 via-emerald-300/30 to-amber-300/40 opacity-40 transition-opacity duration-300 group-hover:opacity-60 group-focus-within:opacity-90"
                  aria-hidden="true"
                />

                {/* Card */}
                <button
                  type="button"
                  onClick={() => router.push("/recherche")}
                  className="
                    relative w-full overflow-hidden rounded-3xl border border-white/10
                    bg-zinc-900/70 backdrop-blur-xl
                    px-6 py-5 text-left
                    shadow-2xl shadow-black/50
                    transition-all duration-300
                    hover:border-white/20 hover:bg-zinc-900/80
                    active:scale-[0.99]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
                  "
                  aria-label="Rechercher un professionnel par métier et localisation"
                >
                  {/* Shimmer */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-hidden="true"
                  >
                    <div className="absolute -left-1/2 top-0 h-full w-[200%] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.06),transparent)] translate-x-[-30%] group-hover:translate-x-[30%] transition-transform duration-700" />
                  </div>

                  <div className="relative flex items-center gap-4">
                    {/* Icon bubble */}
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-[#00FF00] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
                      aria-hidden="true"
                    >
                      <Search className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <span className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        Que recherchez-vous ?
                      </span>
                      <span className="mt-1 block text-white font-semibold text-base md:text-lg">
                        Plombier, Nounou, Mécanicien...
                      </span>
                      <span className="mt-1 block text-xs text-zinc-400">
                        Appuyez pour lancer la recherche
                      </span>
                    </div>

                    {/* CTA bubble */}
                    <div className="hidden md:flex items-center gap-2" aria-hidden="true">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00FF00] text-black shadow-lg shadow-[#00FF00]/20 transition-transform duration-300 group-hover:translate-x-0.5">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Helper chips */}
                <div
                  className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs"
                  role="list"
                  aria-label="Catégories populaires"
                >
                  <span
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300 backdrop-blur"
                    role="listitem"
                  >
                    Plomberie
                  </span>
                  <span
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300 backdrop-blur"
                    role="listitem"
                  >
                    Mécanique
                  </span>
                  <span
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300 backdrop-blur"
                    role="listitem"
                  >
                    Couture
                  </span>
                  <span
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300 backdrop-blur"
                    role="listitem"
                  >
                    Électricité
                  </span>
                </div>
              </div>
            </div>

            {/* BOUTONS D'ACTION (Desktop) */}
            <div className="hidden md:flex items-center justify-center gap-4 pt-4">
              <Link
                href="/annonces"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg shadow-emerald-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                Publier une demande
              </Link>
              <Link
                href="/pro/register"
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-lg shadow-amber-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                Inscrire mon activité
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PREUVES DE CONFIANCE (Compteurs) */}
      <section
        className="border-y border-white/5 bg-black/20 backdrop-blur-sm"
        aria-labelledby="stats-title"
      >
        <h2 id="stats-title" className="sr-only">Statistiques de la plateforme</h2>
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-3xl font-bold text-white" aria-label="1200 professionnels vérifiés">1,200+</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Pros Vérifiés</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-emerald-400" aria-label="450 demandes ce mois">450</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Demandes ce mois</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-amber-400" aria-label="Note moyenne 4.8 sur 5">4.8/5</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Note Moyenne</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-white" aria-label="Disponibilité 24 heures sur 24, 7 jours sur 7">24/7</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Disponibilité</div>
          </div>
        </div>
      </section>

      {/* 3. CATÉGORIES (Métiers) */}
      <section
        className="max-w-7xl mx-auto px-4 py-16 space-y-10"
        aria-labelledby="categories-title"
      >
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2
              id="categories-title"
              className="text-2xl md:text-3xl font-extrabold tracking-tight text-white"
            >
              Explorer par{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF00] via-emerald-300 to-amber-200">
                métier
              </span>
            </h2>
            <p className="text-sm md:text-base text-zinc-400">
              Choisissez une catégorie et trouvez des professionnels disponibles près de chez vous.
            </p>
          </div>

          <Link
            href="/recherche"
            className="text-sm font-semibold tracking-wide text-emerald-300 hover:text-emerald-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1"
            aria-label="Voir toutes les catégories"
          >
            Tout voir <span className="opacity-70" aria-hidden="true">→</span>
          </Link>
        </div>

        <nav aria-label="Catégories de métiers">
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {jobsLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <li key={i}>
                  <div className="h-24 rounded-2xl bg-white/5 animate-pulse" aria-label="Chargement..." />
                </li>
              ))
            ) : (
              jobs.slice(0, 12).map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/recherche?metier=${j.id}`}
                    className="
                      group relative overflow-hidden rounded-2xl border border-white/10
                      bg-zinc-900/50 p-4 text-center
                      transition-all duration-300
                      hover:-translate-y-0.5 hover:border-[#00FF00]/30 hover:bg-zinc-900/70
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00]
                      focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
                      block
                    "
                    aria-label={`Rechercher des professionnels en ${j.name}`}
                  >
                    {/* Glow au hover */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      aria-hidden="true"
                    >
                      <div className="absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-[#00FF00]/12 blur-2xl" />
                      <div className="absolute -bottom-10 right-0 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />
                    </div>

                    <div className="relative flex flex-col items-center justify-center gap-3">
                      {/* Icon capsule */}
                      <div
                        className="
                          flex h-11 w-11 items-center justify-center rounded-2xl
                          border border-white/10 bg-black/30 text-zinc-300
                          transition-all duration-300
                          group-hover:border-[#00FF00]/30 group-hover:text-[#00FF00]
                          group-hover:shadow-[0_0_0_1px_rgba(0,255,0,0.15)]
                        "
                        aria-hidden="true"
                      >
                        <Briefcase size={18} />
                      </div>

                      {/* Libellé */}
                      <span
                        className="
                          text-[13px] font-semibold tracking-wide
                          text-zinc-200 transition-colors duration-300
                          group-hover:text-white
                        "
                      >
                        {j.name}
                      </span>

                      {/* Mini underline premium */}
                      <span
                        className="h-[2px] w-10 rounded-full bg-white/10 transition-all duration-300 group-hover:w-14 group-hover:bg-[#00FF00]/40"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </nav>
      </section>

      {/* 4. COMMENT ÇA MARCHE */}
      <section
        className="bg-zinc-900 py-16 border-y border-white/5"
        aria-labelledby="how-it-works-title"
      >
        <div className="max-w-6xl mx-auto px-4 text-center space-y-12">
          <h2
            id="how-it-works-title"
            className="text-2xl font-bold text-white"
          >
            Comment ça marche ?
          </h2>

          <ol className="grid md:grid-cols-3 gap-8 relative list-none">
            {/* Ligne connectrice (Desktop uniquement) */}
            <div
              className="hidden md:block absolute top-12 left-20 right-20 h-0.5 bg-gradient-to-r from-emerald-900 via-zinc-700 to-emerald-900 -z-0"
              aria-hidden="true"
            />

            <li className="relative z-10 flex flex-col items-center gap-4">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-3xl bg-zinc-950 border border-emerald-500/30 text-emerald-400 shadow-xl"
                aria-hidden="true"
              >
                <Search size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">1. Je cherche un professionnel</h3>
              <p className="text-sm text-zinc-400 max-w-xs">
                Sélectionnez le métier et votre quartier pour voir les profils disponibles.
              </p>
            </li>

            <li className="relative z-10 flex flex-col items-center gap-4">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-3xl bg-zinc-950 border border-amber-500/30 text-amber-400 shadow-xl"
                aria-hidden="true"
              >
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">2. Je compare les avis</h3>
              <p className="text-sm text-zinc-400 max-w-xs">
                Consultez les photos de réalisations, les prix et les notes des autres clients.
              </p>
            </li>

            <li className="relative z-10 flex flex-col items-center gap-4">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-3xl bg-zinc-950 border border-white/10 text-white shadow-xl"
                aria-hidden="true"
              >
                <Phone size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">3. Je contacte direct</h3>
              <p className="text-sm text-zinc-400 max-w-xs">
                Appel ou WhatsApp direct. Pas d'intermédiaire, pas de frais cachés.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* 5. ESPACE PUB (Bannières) */}
      {ads && ads.length > 0 && (
        <section
          className="max-w-7xl mx-auto px-4 py-12"
          aria-labelledby="ads-title"
        >
          <h2
            id="ads-title"
            className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6"
          >
            Offres Partenaires
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {ads.slice(0, 3).map((ad) => (
              <a
                key={ad.id}
                href={ad.lien || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                onClick={() => trackAdClick(ad.id)}
                aria-label={`Voir l'offre partenaire${ad.titre ? `: ${ad.titre}` : ''}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl(ad.image ?? ad.fichier)}
                  alt={ad.titre || "Publicité partenaire"}
                  loading="lazy"
                  className="w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 6. LISTE PROS (Design Cartes) */}
      <section
        className="max-w-7xl mx-auto px-4 py-8 space-y-8"
        aria-labelledby="featured-pros-title"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2
            id="featured-pros-title"
            className="text-2xl font-bold text-white"
          >
            Les mieux notés près de chez vous
          </h2>
        </div>

        {prosLoading ? (
          <div
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
            role="status"
            aria-label="Chargement des professionnels"
          >
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-white/5 animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {pros.map((p) => {
              const isFav = favIds?.has(p.id) ?? false;
              return (
                <article key={p.id}>
                  <Link
                    href={`/pros/${p.id}`}
                    className="block h-full transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-2xl"
                    aria-label={`Voir le profil de ${p.nom || 'ce professionnel'}`}
                  >
                    <ProCard
                      pro={p}
                      isFavorite={isFav}
                      onToggleFavori={(id) => toggleFavoriMutation.mutate(id)}
                    />
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        <div className="flex justify-center pt-8">
          <Link
            href="/recherche"
            className="px-8 py-3 rounded-full border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            Voir plus de professionnels
          </Link>
        </div>
      </section>

      {/* 7. NUMÉRO COMMERCIAL FLOTTANT */}
      <a
        href="tel:780103636"
        className="fixed bottom-20 right-4 z-40 flex items-center gap-3 pl-4 pr-2 py-2 rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-900/40 hover:scale-105 transition-transform border border-emerald-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        aria-label="Appeler le support au 78 010 36 36"
      >
        <div className="text-xs font-bold text-right hidden sm:block">
          <div>Besoin d'aide ?</div>
          <div className="text-emerald-100">78 010 36 36</div>
        </div>
        <div
          className="h-10 w-10 bg-white text-emerald-600 rounded-full flex items-center justify-center"
          aria-hidden="true"
        >
          <Phone size={20} fill="currentColor" />
        </div>
      </a>

    </main>
  );
}