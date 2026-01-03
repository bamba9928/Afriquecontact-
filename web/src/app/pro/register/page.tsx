"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ElementType } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Loader2,
  MapPin,
  Phone,
  Lock,
  Briefcase,
  LocateFixed,
  ChevronDown,
  Search,
  Check,
  Store,
  User
} from "lucide-react";

import {
  getAllJobs,
  getCategoriesTree,
  getLocationsTree,
  getDistrictsFromDepartment,
  type Job,
  type CategoryNode,
  type LocationNode,
} from "@/lib/catalog.api";
import { registerPro, type RegisterPayload } from "@/lib/auth.api";

// --- COMPOSANT SELECT ---

interface Option {
  id: number | string;
  label: string;
}
interface SearchableSelectProps {
  options: Option[];
  value: number | string | undefined;
  onChange: (val: number | string) => void;
  placeholder: string;
  icon?: ElementType;
  disabled?: boolean;
  error?: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled,
  error,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(
    () => options.find((o) => o.id === value)?.label || "",
    [options, value]
  );

  // Fermer au clic dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset recherche à l'ouverture
  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  return (
    <div className="relative" ref={containerRef}>
      {Icon && <Icon className="absolute left-3 top-3 h-4 w-4 text-zinc-500 pointer-events-none z-10" />}

      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full cursor-pointer rounded-xl border bg-black py-3 pl-9 pr-8 text-sm transition-all flex items-center justify-between ${
          disabled
            ? "opacity-50 cursor-not-allowed border-white/5 bg-white/5"
            : error
            ? "border-red-500/50 hover:border-red-500"
            : isOpen
            ? "border-indigo-500 ring-1 ring-indigo-500 border-transparent"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <span className={selectedLabel ? "text-white" : "text-zinc-500 truncate"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown size={14} className={`text-zinc-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 shadow-2xl p-2 max-h-60 flex flex-col z-[100] animate-in fade-in zoom-in-95 duration-100">
          <div className="relative mb-2 shrink-0">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Filtrer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}

              className="w-full rounded-lg bg-black/50 border border-white/5 py-1.5 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="overflow-y-auto custom-scrollbar flex flex-col gap-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-lg px-2 py-2 text-xs text-left transition-colors ${
                    value === opt.id
                      ? "bg-indigo-500/20 text-indigo-300"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.id && <Check size={12} className="shrink-0" />}
                </button>
              ))
            ) : (
              <div className="px-2 py-2 text-xs text-zinc-600 text-center">Aucun résultat</div>
            )}
          </div>
        </div>
      )}

      {error && <span className="text-xs text-red-400 mt-1 ml-1 block">{error}</span>}
    </div>
  );
}

// --- LOGIQUE PAGE ---

type FormValues = {
  phone: string;
  password: string;
  nom_entreprise: string;

  // Cascade Métiers
  cat_id: number;
  subcat_id: number;
  job_id: number;

  // Cascade Zones
  region_id: number;
  department_id: number;
  district_id: number;

  telephone_appel: string;
  telephone_whatsapp: string;
  latitude?: number | null;
  longitude?: number | null;
};

export default function ProRegisterPage() {
  const router = useRouter();
  const [geoLoading, setGeoLoading] = useState(false);

  // --- 1. Chargement des données ---
  const { data: jobsAll } = useQuery({ queryKey: ["jobs-all"], queryFn: getAllJobs, staleTime: Infinity });
  const { data: catsTree } = useQuery({ queryKey: ["cats-tree"], queryFn: getCategoriesTree, staleTime: Infinity });
  const { data: locsTree } = useQuery({ queryKey: ["locs-tree"], queryFn: getLocationsTree, staleTime: Infinity });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      phone: "",
      password: "",
      nom_entreprise: "",
      cat_id: 0,
      subcat_id: 0,
      job_id: 0,
      region_id: 0,
      department_id: 0,
      district_id: 0,
      telephone_appel: "",
      telephone_whatsapp: "",
      latitude: null,
      longitude: null,
    },
  });

  // Champs surveillés
  const phone = watch("phone");
  const catId = watch("cat_id");
  const subCatId = watch("subcat_id");
  const jobId = watch("job_id");

  const regionId = watch("region_id");
  const departmentId = watch("department_id");
  const districtId = watch("district_id");

  // --- 2. Options (Cascades) ---

  // A) Métiers
  const categoryOptions = useMemo(
    () => (catsTree ?? []).map((c: CategoryNode) => ({ id: c.id, label: c.name })),
    [catsTree]
  );

  const subCategoryOptions = useMemo(() => {
    if (!catId || !catsTree) return [];
    const parent = catsTree.find((c: CategoryNode) => c.id === catId);
    return parent?.subcategories?.map((s: CategoryNode) => ({ id: s.id, label: s.name })) || [];
  }, [catId, catsTree]);

  const jobOptions = useMemo(() => {
    if (!subCatId || !jobsAll) return [];
    return jobsAll
      .filter((j: Job) => j.category === subCatId)
      .map((j: Job) => ({ id: j.id, label: j.name }));
  }, [subCatId, jobsAll]);

  // B) Zones : Région -> Département(Ville) -> Quartier
  const regionOptions = useMemo(
    () => (locsTree ?? []).map((r: LocationNode) => ({ id: r.id, label: r.name })),
    [locsTree]
  );

  const departmentOptions = useMemo(() => {
    if (!regionId || !locsTree) return [];
    const region = locsTree.find((r: LocationNode) => r.id === regionId);
    const children = region?.children ?? [];
    return children.map((d: LocationNode) => ({ id: d.id, label: d.name }));
  }, [regionId, locsTree]);


  const districtOptions = useMemo(() => {
    if (!departmentId || !locsTree) return [];

    // 1. Retrouver la région
    const region = locsTree.find((r: LocationNode) => r.id === regionId);
    // 2. Retrouver le département (qui est parent des Villes/Quartiers)
    const dept = region?.children?.find((d: LocationNode) => d.id === departmentId);

    if (!dept) return [];

    // 3. Aplatir la hiérarchie pour avoir les Quartiers
    // (Dept -> City -> Districts) devient une liste plate de Districts
    const districts = getDistrictsFromDepartment(dept);

    return districts.map((q: LocationNode) => ({ id: q.id, label: q.name }));
  }, [regionId, departmentId, locsTree]);

  // --- 3. Reset cascade ---
  useEffect(() => {
    if (subCatId !== 0) setValue("subcat_id", 0);
    if (jobId !== 0) setValue("job_id", 0);
  }, [catId, setValue]);

  useEffect(() => {
    if (jobId !== 0) setValue("job_id", 0);
  }, [subCatId, setValue]);

  useEffect(() => {
    if (departmentId !== 0) setValue("department_id", 0);
    if (districtId !== 0) setValue("district_id", 0);
  }, [regionId, setValue]);

  useEffect(() => {
    if (districtId !== 0) setValue("district_id", 0);
  }, [departmentId, setValue]);

  // Auto-fill téléphone
  useEffect(() => {
    if (phone) {
      if (!watch("telephone_appel")) setValue("telephone_appel", phone);
      if (!watch("telephone_whatsapp")) setValue("telephone_whatsapp", phone);
    }
  }, [phone, setValue]);

  // --- 4. Submit ---
  const regMut = useMutation({
    mutationFn: (data: RegisterPayload) => registerPro(data),
    onSuccess: (res) => {
      toast.success("Compte créé avec succès !");
      if (res.phone) {
         router.push(`/pro/verify?phone=${encodeURIComponent(res.phone)}`);
      } else {
         router.push("/pro/login");
      }
    },
    onError: (err: any) => {
      console.error(err);
      const msg = err.response?.data?.detail || "Erreur lors de l'inscription.";
      toast.error(msg);
    },
  });

  const onSubmit = (v: FormValues) => {
    if (!v.job_id) return toast.error("Veuillez sélectionner votre métier précis.");
    if (!v.district_id) return toast.error("Veuillez sélectionner votre quartier.");

    regMut.mutate({
      phone: v.phone,
      password: v.password,
      nom_entreprise: v.nom_entreprise,
      metier_id: Number(v.job_id),
      zone_id: Number(v.district_id),
      telephone_appel: v.telephone_appel || v.phone,
      telephone_whatsapp: v.telephone_whatsapp || v.phone,
      latitude: v.latitude ?? null,
      longitude: v.longitude ?? null,
      description: "",
    });
  };

  const askGeo = () => {
    if (!navigator.geolocation) return toast.error("Géolocalisation non supportée.");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", pos.coords.latitude);
        setValue("longitude", pos.coords.longitude);
        toast.success("Position GPS enregistrée !");
        setGeoLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("Impossible d'obtenir la position.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Créer un compte Professionnel</h1>
        <p className="text-sm text-zinc-400">Rejoignez l'annuaire de référence au Sénégal.</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 md:p-8 backdrop-blur-sm shadow-xl"
      >
        {/* IDENTIFICATION */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 pb-2 border-b border-white/5">
             <User size={14} /> Identification
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Nom de l'entreprise / Prestataire *</label>
            <div className="relative">
              <Store className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                {...register("nom_entreprise", { required: true })}
                placeholder="Ex: Atelier Mame Diarra"
                className="w-full rounded-xl bg-black border border-white/10 pl-9 pr-3 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
              />
            </div>
            {errors.nom_entreprise && <span className="text-xs text-red-400">Ce champ est requis</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Téléphone (Login) *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="tel"
                  {...register("phone", { required: true, minLength: 9 })}
                  placeholder="77 000 00 00"
                  className="w-full rounded-xl bg-black border border-white/10 pl-9 pr-3 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Mot de passe *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  {...register("password", { required: true, minLength: 6 })}
                  placeholder="••••••"
                  className="w-full rounded-xl bg-black border border-white/10 pl-9 pr-3 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* MÉTIER (CASCADE) */}
        <div className="space-y-4 pt-2">
          <h3 className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 pb-2 border-b border-white/5">
             <Briefcase size={14} /> Votre Activité
          </h3>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Secteur d'activité</label>
            <SearchableSelect
              icon={Briefcase}
              placeholder="Sélectionner un secteur..."
              options={categoryOptions}
              value={catId || undefined}
              onChange={(v) => setValue("cat_id", Number(v), { shouldDirty: true, shouldValidate: true })}
              error={errors.cat_id ? "Requis" : undefined}
            />
          </div>

          <div className={`space-y-1 transition-all duration-300 ${!catId ? "opacity-50 pointer-events-none grayscale" : ""}`}>
            <label className="text-xs text-zinc-400">Catégorie</label>
            <SearchableSelect
              placeholder="Sélectionner une catégorie..."
              options={subCategoryOptions}
              value={subCatId || undefined}
              onChange={(v) => setValue("subcat_id", Number(v), { shouldDirty: true, shouldValidate: true })}
              disabled={!catId}
              error={errors.subcat_id ? "Requis" : undefined}
            />
          </div>

          <div className={`space-y-1 transition-all duration-300 ${!subCatId ? "opacity-50 pointer-events-none grayscale" : ""}`}>
            <label className="text-xs text-zinc-400 font-bold text-white">Métier Précis *</label>
            <SearchableSelect
              placeholder="Sélectionner votre métier..."
              options={jobOptions}
              value={jobId || undefined}
              onChange={(v) => setValue("job_id", Number(v), { shouldDirty: true, shouldValidate: true })}
              disabled={!subCatId}
              error={errors.job_id ? "Requis" : undefined}
            />
          </div>
        </div>

        {/* LOCALISATION (CASCADE) */}
        <div className="space-y-4 pt-2">
          <h3 className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-3 pb-2 border-b border-white/5">
             <MapPin size={14} /> Localisation
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Région</label>
              <SearchableSelect
                icon={MapPin}
                placeholder="Région..."
                options={regionOptions}
                value={regionId || undefined}
                onChange={(v) => setValue("region_id", Number(v), { shouldDirty: true, shouldValidate: true })}
                error={errors.region_id ? "Requis" : undefined}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className={`space-y-1 transition-all duration-300 ${!regionId ? "opacity-50 pointer-events-none" : ""}`}>
                <label className="text-xs text-zinc-400">Ville / Département</label>
                <SearchableSelect
                    placeholder="Ville..."
                    options={departmentOptions}
                    value={departmentId || undefined}
                    onChange={(v) => setValue("department_id", Number(v), { shouldDirty: true, shouldValidate: true })}
                    disabled={!regionId}
                    error={errors.department_id ? "Requis" : undefined}
                />
                </div>

                <div className={`space-y-1 transition-all duration-300 ${!departmentId ? "opacity-50 pointer-events-none" : ""}`}>
                <label className="text-xs text-zinc-400 font-bold text-white">Quartier *</label>
                <SearchableSelect
                    placeholder="Quartier..."
                    options={districtOptions}
                    value={districtId || undefined}
                    onChange={(v) => setValue("district_id", Number(v), { shouldDirty: true, shouldValidate: true })}
                    disabled={!departmentId}
                    error={errors.district_id ? "Requis" : undefined}
                />
                </div>
            </div>
          </div>

          <button
            type="button"
            onClick={askGeo}
            disabled={geoLoading || !!watch("latitude")}
            className={`flex items-center justify-center gap-2 text-xs font-medium rounded-xl w-full py-3 border transition-all ${
                watch("latitude")
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-default"
                : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
            {watch("latitude") ? "Position GPS validée ✓" : "Utiliser ma position GPS actuelle"}
          </button>
        </div>

        <button
          type="submit"
          disabled={regMut.isPending || geoLoading}
          className="w-full mt-4 flex justify-center items-center gap-2 rounded-xl bg-white text-black py-4 font-bold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {regMut.isPending ? <Loader2 className="animate-spin" /> : "S'inscrire maintenant"}
        </button>
      </form>
    </main>
  );
}