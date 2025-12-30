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
} from "lucide-react";

import {
  getAllJobs,
  getCategoriesTree,
  getLocationsTree,
  type Job,
  type CategoryNode,
  type LocationNode,
} from "@/lib/catalog.api";
import { registerPro, type RegisterPayload } from "@/lib/auth.api";

// --- COMPOSANT SEARCHABLE SELECT (Réutilisable) ---
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full cursor-pointer rounded-xl border bg-black py-2.5 pl-9 pr-8 text-sm transition-all flex items-center justify-between ${
          disabled
            ? "opacity-50 cursor-not-allowed border-white/5"
            : error
            ? "border-red-500/50 hover:border-red-500"
            : isOpen
            ? "border-indigo-500 ring-1 ring-indigo-500 border-transparent"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <span className={selectedLabel ? "text-white" : "text-zinc-500"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 shadow-2xl p-2 max-h-60 flex flex-col z-[100]">
          <div className="relative mb-2 shrink-0">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-500" />
            <input
              autoFocus
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

      {error && <span className="text-xs text-red-400 mt-1 ml-1">{error}</span>}
    </div>
  );
}

// --- LOGIQUE PAGE ---

type FormValues = {
  phone: string;
  password: string;
  nom_entreprise: string;

  // Cascade Métiers
  cat_id: number; // Secteur
  subcat_id: number; // Spécialité
  job_id: number; // Métier final

  // Cascade Zones (Région -> Département -> Quartier)
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
  const { data: jobsAll } = useQuery({ queryKey: ["jobs-all"], queryFn: getAllJobs });
  const { data: catsTree } = useQuery({ queryKey: ["cats-tree"], queryFn: getCategoriesTree });
  const { data: locsTree } = useQuery({ queryKey: ["locs-tree"], queryFn: getLocationsTree });

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

  // B) Zones : Région -> Département -> Quartier
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
    const region = locsTree.find((r: LocationNode) => r.id === regionId);
    const dept = region?.children?.find((d: LocationNode) => d.id === departmentId);
    const children = dept?.children ?? [];
    return children.map((q: LocationNode) => ({ id: q.id, label: q.name }));
  }, [regionId, departmentId, locsTree]);

  // --- 3. Reset cascade ---
  useEffect(() => {
    setValue("subcat_id", 0, { shouldDirty: true, shouldValidate: true });
    setValue("job_id", 0, { shouldDirty: true, shouldValidate: true });
  }, [catId, setValue]);

  useEffect(() => {
    setValue("job_id", 0, { shouldDirty: true, shouldValidate: true });
  }, [subCatId, setValue]);

  useEffect(() => {
    setValue("department_id", 0, { shouldDirty: true, shouldValidate: true });
    setValue("district_id", 0, { shouldDirty: true, shouldValidate: true });
  }, [regionId, setValue]);

  useEffect(() => {
    setValue("district_id", 0, { shouldDirty: true, shouldValidate: true });
  }, [departmentId, setValue]);

  // Auto-fill téléphone
  useEffect(() => {
    if (!phone) return;
    if (!watch("telephone_appel")) setValue("telephone_appel", phone);
    if (!watch("telephone_whatsapp")) setValue("telephone_whatsapp", phone);
  }, [phone, setValue, watch]);

  // --- 4. Submit ---
  const regMut = useMutation({
    mutationFn: (data: RegisterPayload) => registerPro(data),
    onSuccess: (res) => {
      toast.success("Inscription réussie !");
      router.push(`/pro/verify?phone=${encodeURIComponent(res.phone)}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Erreur inscription"),
  });

  const onSubmit = (v: FormValues) => {
    if (!v.job_id) return toast.error("Le métier est requis");
    if (!v.district_id) return toast.error("Le quartier est requis");

    regMut.mutate({
      phone: v.phone,
      password: v.password,
      nom_entreprise: v.nom_entreprise,
      metier_id: Number(v.job_id),
      zone_id: Number(v.district_id), // quartier final
      telephone_appel: v.telephone_appel,
      telephone_whatsapp: v.telephone_whatsapp,
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
        toast.success("Position capturée");
        setGeoLoading(false);
      },
      () => {
        toast.error("Erreur position");
        setGeoLoading(false);
      }
    );
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white">Devenir Partenaire</h1>
        <p className="text-sm text-zinc-400">Remplissez les détails pour être visible sur ContactAfrique.</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm shadow-xl"
      >
        {/* Champs cachés pour RHF (assure que les selects sont soumis/validés) */}
        <input type="hidden" {...register("cat_id", { valueAsNumber: true, required: true })} />
        <input type="hidden" {...register("subcat_id", { valueAsNumber: true, required: true })} />
        <input type="hidden" {...register("job_id", { valueAsNumber: true, required: true })} />
        <input type="hidden" {...register("region_id", { valueAsNumber: true, required: true })} />
        <input type="hidden" {...register("department_id", { valueAsNumber: true, required: true })} />
        <input type="hidden" {...register("district_id", { valueAsNumber: true, required: true })} />

        {/* IDENTIFICATION */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Identification</h3>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Nom Commercial</label>
            <div className="relative">
              <Store className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                {...register("nom_entreprise", { required: true })}
                placeholder="Ex: Atelier Mame Diarra"
                className="w-full rounded-xl bg-black border border-white/10 pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Téléphone (Login)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="tel"
                  {...register("phone", { required: true })}
                  placeholder="77..."
                  className="w-full rounded-xl bg-black border border-white/10 pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  {...register("password", { required: true, minLength: 6 })}
                  placeholder="••••••"
                  className="w-full rounded-xl bg-black border border-white/10 pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-white/5" />

        {/* MÉTIER (CASCADE 3 NIVEAUX) */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Activité</h3>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Secteur d'activité</label>
            <SearchableSelect
              icon={Briefcase}
              placeholder="Choisir secteur..."
              options={categoryOptions}
              value={catId || undefined}
              onChange={(v) => setValue("cat_id", Number(v), { shouldDirty: true, shouldValidate: true })}
              error={errors.cat_id ? "Requis" : undefined}
            />
          </div>

          <div className={`space-y-1 transition-all ${!catId ? "opacity-50 pointer-events-none" : ""}`}>
            <label className="text-xs text-zinc-400">Spécialisation</label>
            <SearchableSelect
              placeholder={!catId ? "Choisir un secteur d'abord" : "Choisir spécialité..."}
              options={subCategoryOptions}
              value={subCatId || undefined}
              onChange={(v) => setValue("subcat_id", Number(v), { shouldDirty: true, shouldValidate: true })}
              disabled={!catId}
              error={errors.subcat_id ? "Requis" : undefined}
            />
          </div>

          <div className={`space-y-1 transition-all ${!subCatId ? "opacity-50 pointer-events-none" : ""}`}>
            <label className="text-xs text-zinc-400">Métier Précis</label>
            <SearchableSelect
              placeholder={!subCatId ? "Choisir une spécialité d'abord" : "Rechercher votre métier..."}
              options={jobOptions}
              value={jobId || undefined}
              onChange={(v) => setValue("job_id", Number(v), { shouldDirty: true, shouldValidate: true })}
              disabled={!subCatId}
              error={errors.job_id ? "Requis" : undefined}
            />
          </div>
        </div>

        <hr className="border-white/5" />

        {/* ZONE (CASCADE 3 NIVEAUX) */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">Localisation</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            <div className={`space-y-1 transition-all ${!regionId ? "opacity-50 pointer-events-none" : ""}`}>
              <label className="text-xs text-zinc-400">Département</label>
              <SearchableSelect
                placeholder={!regionId ? "..." : "Département..."}
                options={departmentOptions}
                value={departmentId || undefined}
                onChange={(v) => setValue("department_id", Number(v), { shouldDirty: true, shouldValidate: true })}
                disabled={!regionId}
                error={errors.department_id ? "Requis" : undefined}
              />
            </div>

            <div className={`space-y-1 transition-all ${!departmentId ? "opacity-50 pointer-events-none" : ""}`}>
              <label className="text-xs text-zinc-400">Quartier</label>
              <SearchableSelect
                placeholder={!departmentId ? "..." : "Quartier..."}
                options={districtOptions}
                value={districtId || undefined}
                onChange={(v) => setValue("district_id", Number(v), { shouldDirty: true, shouldValidate: true })}
                disabled={!departmentId}
                error={errors.district_id ? "Requis" : undefined}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={askGeo}
            disabled={geoLoading}
            className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors bg-white/5 px-3 py-2 rounded-lg w-full justify-center border border-white/5 hover:bg-white/10"
          >
            {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
            {watch("latitude") ? "Position GPS validée ✓" : "Ajouter ma position GPS (Recommandé)"}
          </button>
        </div>

        <button
          type="submit"
          disabled={regMut.isPending}
          className="w-full mt-4 flex justify-center items-center gap-2 rounded-xl bg-white text-black py-3.5 font-bold hover:bg-zinc-200 transition-colors disabled:opacity-60"
        >
          {regMut.isPending ? <Loader2 className="animate-spin" /> : "Créer mon compte Pro"}
        </button>
      </form>
    </main>
  );
}
