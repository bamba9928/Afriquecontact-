"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth.store"; // Import du store Auth
import { getAllJobs, getLocations } from "@/lib/catalog.api";
import {
  rechercherPros,
  listFavoris,
  addFavori,
  removeFavori,
  type ProsSearchParams
} from "@/lib/pros.api";
import ProCard from "@/components/ProCard";
import { Search, MapPin, Briefcase, Filter, X, LocateFixed, ChevronLeft, ChevronRight, Signal, Loader2, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

// --- Utilitaires ---

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function toInt(v: string | null, def: number = 0) {
  if (!v) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

// --- Composant Interne (Logique) ---

function SearchContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  // 1. Initialisation des états depuis l'URL
  const [metier, setMetier] = useState<number | "">(toInt(sp.get("metier"), 0) || "");
  const [zone, setZone] = useState<number | "">(toInt(sp.get("zone_geographique"), 0) || "");
  const [rawQ, setRawQ] = useState(sp.get("search") || "");
  const [statut, setStatut] = useState<"" | "ONLINE" | "OFFLINE">((sp.get("statut_en_ligne") as any) || "");

  // Géolocalisation
  const [lat, setLat] = useState<number | undefined>(sp.get("lat") ? Number(sp.get("lat")) : undefined);
  const [lng, setLng] = useState<number | undefined>(sp.get("lng") ? Number(sp.get("lng")) : undefined);
  const [radiusKm, setRadiusKm] = useState<number>(toInt(sp.get("radius_km"), 5));
  const [useGeo, setUseGeo] = useState(!!sp.get("lat"));

  // Pagination
  const [page, setPage] = useState<number>(toInt(sp.get("page"), 1));
  const pageSize = 10;

  const debouncedQ = useDebounce(rawQ, 500);

  // Reset page si les filtres changent
  useEffect(() => {
    setPage(1);
  }, [metier, zone, debouncedQ, statut, useGeo, radiusKm]);

  // Synchronisation URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (metier) params.set("metier", String(metier));
    if (zone) params.set("zone_geographique", String(zone));
    if (debouncedQ) params.set("search", debouncedQ);
    if (statut) params.set("statut_en_ligne", statut);
    if (page > 1) params.set("page", String(page));
    if (useGeo && lat && lng) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
      params.set("radius_km", String(radiusKm));
      params.set("sort", "distance");
    }
    router.replace(`/recherche?${params.toString()}`, { scroll: false });
  }, [metier, zone, debouncedQ, statut, page, useGeo, lat, lng, radiusKm, router]);

  // Chargement des référentiels
  const { data: jobs } = useQuery({ queryKey: ["jobs-all"], queryFn: getAllJobs, staleTime: 1000 * 60 * 60 });
  const { data: locs } = useQuery({ queryKey: ["locs"], queryFn: getLocations, staleTime: 1000 * 60 * 60 });

  // --- REQUÊTES PRINCIPALES ---

  // A. Recherche des Pros
  const searchParams: ProsSearchParams = useMemo(() => ({
    metier: metier || undefined,
    zone_geographique: zone || undefined,
    search: debouncedQ || undefined,
    statut_en_ligne: statut || undefined,
    lat: useGeo ? lat : undefined,
    lng: useGeo ? lng : undefined,
    radius_km: useGeo ? radiusKm : undefined,
    sort: useGeo ? "distance" : undefined,
    page,
    page_size: pageSize
  }), [metier, zone, debouncedQ, statut, useGeo, lat, lng, radiusKm, page]);

  const { data: prosData, isLoading, isFetching } = useQuery({
    queryKey: ["pros-recherche", searchParams],
    queryFn: () => rechercherPros(searchParams),
    placeholderData: (prev) => prev,
  });

  // B. Chargement des Favoris (IDs uniquement pour check rapide)
  const { data: favIds } = useQuery({
    queryKey: ["favoris-ids"],
    queryFn: async () => {
      const data = await listFavoris();
      // On crée un Set avec les IDs des pros favoris pour un accès O(1)
      return new Set((data.results ?? []).map((fav) => fav.professionnel));
    },
    enabled: !!token, // Ne charge que si connecté
    staleTime: 1000 * 60 * 5, // Cache 5 min
  });

  // --- ACTIONS ---

  const toggleFavoriMutation = useMutation({
    mutationFn: async (proId: number) => {
      if (!token) {
        router.push("/pro/login");
        throw new Error("Login required");
      }

      const isFav = favIds?.has(proId);
      if (isFav) {
        return removeFavori(proId);
      } else {
        return addFavori(proId);
      }
    },
    onSuccess: () => {
      // On rafraîchit la liste des IDs et la liste complète des favoris
      queryClient.invalidateQueries({ queryKey: ["favoris-ids"] });
      queryClient.invalidateQueries({ queryKey: ["favoris"] });
      toast.success("Contacts mis à jour");
    },
    onError: (err) => {
        if(err.message !== "Login required") toast.error("Une erreur est survenue");
    }
  });

  const resetFilters = () => {
    setMetier("");
    setZone("");
    setRawQ("");
    setStatut("");
    setUseGeo(false);
    setPage(1);
  };

  const askLocation = () => {
    if (!navigator.geolocation) return alert("Géolocalisation non supportée");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setUseGeo(true);
      },
      (err) => alert("Accès à la position refusé.")
    );
  };

  return (
    <div className="space-y-6">

      {/* FILTRES (Code identique au précédent) */}
      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-sm shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            <Filter size={16} /> Filtres avancés
          </h2>
          {(metier || zone || rawQ || statut || useGeo) && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              <X size={12} /> Tout effacer
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Métier</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
              <select value={metier} onChange={(e) => setMetier(Number(e.target.value) || "")} className="w-full appearance-none rounded-xl border border-white/10 bg-black py-2 pl-9 pr-8 text-sm outline-none focus:border-indigo-500 transition-all">
                <option value="">Tous les métiers</option>
                {jobs?.map((j) => <option key={j.id} value={j.id}>{j.nom ?? j.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Zone</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
              <select value={zone} onChange={(e) => setZone(Number(e.target.value) || "")} className="w-full appearance-none rounded-xl border border-white/10 bg-black py-2 pl-9 pr-8 text-sm outline-none focus:border-indigo-500 transition-all">
                <option value="">Toute zone</option>
                {locs?.map((l) => <option key={l.id} value={l.id}>{l.nom ?? l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Mot-clé</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input value={rawQ} onChange={(e) => setRawQ(e.target.value)} placeholder="Nom, ex: Ndiaye..." className="w-full rounded-xl border border-white/10 bg-black py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-700" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Disponibilité</label>
            <div className="relative">
              <Signal className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
              <select value={statut} onChange={(e) => setStatut(e.target.value as any)} className="w-full appearance-none rounded-xl border border-white/10 bg-black py-2 pl-9 pr-8 text-sm outline-none focus:border-indigo-500 transition-all">
                <option value="">Peu importe</option>
                <option value="ONLINE">🟢 En Ligne</option>
                <option value="OFFLINE">🔴 Hors Ligne</option>
              </select>
            </div>
          </div>
        </div>

        {/* Toggle Geo */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
          <button onClick={askLocation} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${useGeo ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"}`}>
            <LocateFixed size={14} /> {useGeo ? "Localisation active" : "Trier par proximité"}
          </button>
          {useGeo && (<div className="flex items-center gap-2"><span className="text-xs text-zinc-500">Rayon :</span><input type="number" value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="w-16 rounded-lg border border-white/10 bg-black px-2 py-1 text-xs text-center outline-none focus:border-emerald-500"/><span className="text-xs text-zinc-500">km</span></div>)}
        </div>
      </section>

      {/* --- RÉSULTATS AVEC BOUTON FAVORIS --- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="text-sm text-zinc-400">
            {isLoading ? "Recherche..." : <span className="text-white font-medium">{prosData?.count ?? 0}</span>} professionnels trouvés
          </div>
          {isFetching && !isLoading && <div className="text-xs text-indigo-400 animate-pulse">Actualisation...</div>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => <div key={i} className="h-40 rounded-2xl border border-white/5 bg-zinc-900 animate-pulse" />)
          ) : (
            (prosData?.results ?? []).map((p) => {
              // Vérifie si l'ID est dans le Set des favoris
              const isFav = favIds?.has(p.id) ?? false;
              const isProcessing = toggleFavoriMutation.isPending && toggleFavoriMutation.variables === p.id;

              return (
                <div key={p.id} className="flex flex-col gap-2">
                  {/* On passe isFavorite pour que le cœur interne de la carte s'allume aussi */}
                  <ProCard
                    pro={p}
                    isFavorite={isFav}
                    onToggleFavori={(id) => toggleFavoriMutation.mutate(id)}
                  />

                  {/* BOUTON EXTERNE DEMANDÉ */}
                  <button
                    onClick={() => toggleFavoriMutation.mutate(p.id)}
                    disabled={isProcessing}
                    className={`flex items-center justify-center gap-2 w-full rounded-xl border px-3 py-2 text-sm transition-colors ${
                      isFav
                        ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "border-white/20 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isFav ? (
                      <><UserMinus size={16} /> Retirer contact</>
                    ) : (
                      <><UserPlus size={16} /> Ajouter contact</>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {!isLoading && (prosData?.results ?? []).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
            <Search className="h-10 w-10 text-zinc-600 mb-3" />
            <h3 className="text-lg font-medium text-white">Aucun résultat</h3>
            <button onClick={resetFilters} className="mt-4 text-sm text-indigo-400 hover:underline">Tout réinitialiser</button>
          </div>
        )}
      </section>

      {/* Pagination (Code identique) */}
      {prosData && prosData.count > pageSize && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!prosData.previous} className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /> Précédent</button>
          <span className="text-sm font-medium text-zinc-400">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={!prosData.next} className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Suivant <ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}

export default function RecherchePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Rechercher un pro</h1>
      <Suspense fallback={<div className="p-10 text-center text-zinc-500">Chargement...</div>}>
        <SearchContent />
      </Suspense>
    </main>
  );
}