"use client";

import { useState, useMemo, useEffect, Suspense, useRef } from "react";
import type { ElementType } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth.store";

import { getAllJobs, getLocationsTree, type LocationNode } from "@/lib/catalog.api";
import {
  rechercherPros,
  listFavoris,
  addFavori,
  removeFavori,
  type ProsSearchParams,
} from "@/lib/pros.api";

import ProCard from "@/components/ProCard";
import {
  Search,
  MapPin,
  Briefcase,
  Filter,
  X,
  LocateFixed,
  ChevronLeft,
  ChevronRight,
  Signal,
  Loader2,
  UserPlus,
  UserMinus,
  ChevronDown,
  Check,
} from "lucide-react";
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

// --- Composant Réutilisable: SearchableSelect ---

interface Option {
  id: number | string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: number | string | "";
  onChange: (val: any) => void;
  placeholder: string;
  icon: ElementType;
  disabled?: boolean;
}

function SearchableSelect({ options, value, onChange, placeholder, icon: Icon, disabled }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => options.find((o) => o.id === value)?.label || "", [options, value]);

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, search]);

  return (
    <div className="relative" ref={containerRef}>
      <Icon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none z-10" />

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full cursor-pointer rounded-xl border bg-black py-2 pl-9 pr-8 text-sm outline-none transition-all flex items-center justify-between ${
          disabled
            ? "border-white/5 opacity-50 cursor-not-allowed"
            : isOpen
            ? "border-indigo-500 ring-1 ring-indigo-500 border-transparent"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <span className={value ? "text-white" : "text-zinc-500"}>{selectedLabel || placeholder}</span>
        <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-100 max-h-60 flex flex-col">
          <div className="relative mb-2 shrink-0">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-500" />
            <input
              autoFocus
              type="text"
              placeholder="Filtrer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-black/50 border border-white/5 py-1.5 pl-8 pr-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="overflow-y-auto custom-scrollbar flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-left transition-colors ${
                value === "" ? "bg-indigo-500/20 text-indigo-300" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{placeholder} (Tous)</span>
              {value === "" && <Check size={12} />}
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-left transition-colors ${
                    value === opt.id
                      ? "bg-indigo-500/20 text-indigo-300"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{opt.label}</span>
                  {value === opt.id && <Check size={12} />}
                </button>
              ))
            ) : (
              <div className="px-2 py-2 text-xs text-zinc-600 text-center">Aucun résultat</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Composant Principal (Logique) ---

function SearchContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  // 1) États (zone_geographique = Quartier/DISTRICT)
  const [metier, setMetier] = useState<number | "">(toInt(sp.get("metier"), 0) || "");
  const [regionId, setRegionId] = useState<number | "">("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [districtId, setDistrictId] = useState<number | "">(toInt(sp.get("zone_geographique"), 0) || "");

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

  // Reset page si filtres changent
  useEffect(() => {
    setPage(1);
  }, [metier, districtId, debouncedQ, statut, useGeo, radiusKm]);

  // Chargement référentiels
  const { data: jobs } = useQuery({ queryKey: ["jobs-all"], queryFn: getAllJobs, staleTime: Infinity });
  const { data: locsTree } = useQuery({ queryKey: ["locs-tree"], queryFn: getLocationsTree, staleTime: Infinity });

  // Auto-détection Région + Département à partir du Quartier (URL zone_geographique)
  useEffect(() => {
    if (!districtId || regionId || departmentId || !locsTree) return;

    for (const r of locsTree as LocationNode[]) {
      for (const d of r.children ?? []) {
        const found = (d.children ?? []).some((q) => q.id === districtId);
        if (found) {
          setRegionId(r.id);
          setDepartmentId(d.id);
          return;
        }
      }
    }
  }, [districtId, regionId, departmentId, locsTree]);

  // Synchronisation URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (metier) params.set("metier", String(metier));
    // On filtre par quartier (id)
    if (districtId) params.set("zone_geographique", String(districtId));

    if (debouncedQ) params.set("search", debouncedQ);
    if (statut) params.set("statut_en_ligne", statut);
    if (page > 1) params.set("page", String(page));

    if (useGeo && lat != null && lng != null) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
      params.set("radius_km", String(radiusKm));
      params.set("sort", "distance");
    }

    router.replace(`/recherche?${params.toString()}`, { scroll: false });
  }, [metier, districtId, debouncedQ, statut, page, useGeo, lat, lng, radiusKm, router]);

  // Options métiers
  const jobOptions = useMemo(() => (jobs ?? []).map((j) => ({ id: j.id, label: j.name })), [jobs]);

  // Options zones: Région -> Département -> Quartier
  const regionOptions = useMemo(() => (locsTree ?? []).map((r) => ({ id: r.id, label: r.name })), [locsTree]);

  const departmentOptions = useMemo(() => {
    if (!regionId || !locsTree) return [];
    const region = locsTree.find((r) => r.id === regionId);
    return (region?.children ?? []).map((d) => ({ id: d.id, label: d.name }));
  }, [regionId, locsTree]);

  const districtOptions = useMemo(() => {
    if (!regionId || !departmentId || !locsTree) return [];
    const region = locsTree.find((r) => r.id === regionId);
    const dept = (region?.children ?? []).find((d) => d.id === departmentId);
    return (dept?.children ?? []).map((q) => ({ id: q.id, label: q.name }));
  }, [regionId, departmentId, locsTree]);

  // Reset cascade zone
  useEffect(() => {
    setDepartmentId("");
    setDistrictId("");
  }, [regionId]);

  useEffect(() => {
    setDistrictId("");
  }, [departmentId]);

  // --- REQUÊTES PRINCIPALES ---

  const searchParams: ProsSearchParams = useMemo(
    () => ({
      metier: metier || undefined,
      zone_geographique: districtId || undefined,
      search: debouncedQ || undefined,
      statut_en_ligne: statut || undefined,
      lat: useGeo ? lat : undefined,
      lng: useGeo ? lng : undefined,
      radius_km: useGeo ? radiusKm : undefined,
      sort: useGeo ? "distance" : undefined,
      page,
      page_size: pageSize,
    }),
    [metier, districtId, debouncedQ, statut, useGeo, lat, lng, radiusKm, page]
  );

  const { data: prosData, isLoading, isFetching } = useQuery({
    queryKey: ["pros-recherche", searchParams],
    queryFn: () => rechercherPros(searchParams),
    placeholderData: (prev) => prev,
  });

  const { data: favIds } = useQuery({
    queryKey: ["favoris-ids"],
    queryFn: async () => {
      const data = await listFavoris({ page: 1, page_size: 100 });
      return new Set((data.results ?? []).map((fav) => fav.professionnel));
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  // --- ACTIONS ---

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
      toast.success("Contacts mis à jour");
    },
    onError: (err: any) => {
      if (err?.message !== "Login required") toast.error("Une erreur est survenue");
    },
  });

  const resetFilters = () => {
    setMetier("");
    setRegionId("");
    setDepartmentId("");
    setDistrictId("");
    setRawQ("");
    setStatut("");
    setUseGeo(false);
    setPage(1);
    setLat(undefined);
    setLng(undefined);
  };

  const askLocation = () => {
    if (!navigator.geolocation) return toast.error("Géolocalisation non supportée");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setUseGeo(true);
        toast.success("Localisation activée");
      },
      () => toast.error("Accès à la position refusé.")
    );
  };

  return (
    <div className="space-y-6">
      {/* FILTRES AVANCÉS */}
      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-sm shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            <Filter size={16} /> Filtres avancés
          </h2>
          {(metier || regionId || departmentId || districtId || rawQ || statut || useGeo) && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <X size={12} /> Tout effacer
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Métier */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Métier</label>
            <SearchableSelect
              icon={Briefcase}
              placeholder="Choisir un métier..."
              options={jobOptions}
              value={metier}
              onChange={setMetier}
            />
          </div>

          {/* Région */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Région</label>
            <SearchableSelect
              icon={MapPin}
              placeholder="Toute région"
              options={regionOptions}
              value={regionId}
              onChange={(v) => setRegionId(v)}
            />
          </div>

          {/* Département */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Département</label>
            <SearchableSelect
              icon={MapPin}
              placeholder={!regionId ? "Choisir une région..." : "Tout département"}
              options={departmentOptions}
              value={departmentId}
              onChange={(v) => setDepartmentId(v)}
              disabled={!regionId}
            />
          </div>

          {/* Quartier */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Quartier</label>
            <SearchableSelect
              icon={MapPin}
              placeholder={!departmentId ? "Choisir un département..." : "Tout quartier"}
              options={districtOptions}
              value={districtId}
              onChange={setDistrictId}
              disabled={!departmentId}
            />
          </div>

          {/* Mot-clé */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs text-zinc-500">Mot-clé</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input
                value={rawQ}
                onChange={(e) => setRawQ(e.target.value)}
                placeholder="Nom, ex: Ndiaye..."
                className="w-full rounded-xl border border-white/10 bg-black py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-700"
              />
            </div>
          </div>

          {/* Disponibilité */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs text-zinc-500">Disponibilité</label>
            <div className="relative">
              <Signal className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as any)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-black py-2 pl-9 pr-8 text-sm outline-none focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="">Peu importe</option>
                <option value="ONLINE">🟢 En Ligne</option>
                <option value="OFFLINE">🔴 Hors Ligne</option>
              </select>
            </div>
          </div>
        </div>

        {/* Toggle Geo */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={askLocation}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              useGeo
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            <LocateFixed size={14} /> {useGeo ? "Localisation active" : "Trier par proximité"}
          </button>

          {useGeo && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Rayon :</span>
              <input
                type="number"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-16 rounded-lg border border-white/10 bg-black px-2 py-1 text-xs text-center outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-zinc-500">km</span>
            </div>
          )}
        </div>
      </section>

      {/* RÉSULTATS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="text-sm text-zinc-400">
            {isLoading ? "Recherche..." : <span className="text-white font-medium">{prosData?.count ?? 0}</span>}{" "}
            professionnels trouvés
          </div>
          {isFetching && !isLoading && <div className="text-xs text-indigo-400 animate-pulse">Actualisation...</div>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => <div key={i} className="h-40 rounded-2xl border border-white/5 bg-zinc-900 animate-pulse" />)
          ) : (
            (prosData?.results ?? []).map((p) => {
              const isFav = favIds?.has(p.id) ?? false;
              const isProcessing = toggleFavoriMutation.isPending && toggleFavoriMutation.variables === p.id;

              return (
                <div key={p.id} className="flex flex-col gap-2">
                  <ProCard pro={p} isFavorite={isFav} onToggleFavori={(id) => toggleFavoriMutation.mutate(id)} />
                  <button
                    type="button"
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
                      <>
                        <UserMinus size={16} /> Retirer contact
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} /> Ajouter contact
                      </>
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
            <button type="button" onClick={resetFilters} className="mt-4 text-sm text-indigo-400 hover:underline">
              Tout réinitialiser
            </button>
          </div>
        )}
      </section>

      {/* Pagination */}
      {prosData && prosData.count > pageSize && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!prosData.previous}
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Précédent
          </button>
          <span className="text-sm font-medium text-zinc-400">Page {page}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!prosData.next}
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Suivant <ChevronRight size={16} />
          </button>
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
