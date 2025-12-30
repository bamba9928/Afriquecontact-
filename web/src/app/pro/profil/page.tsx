"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, Upload, Power, CreditCard,
  Image as ImageIcon, AlertTriangle, CheckCircle, Smartphone
} from "lucide-react";

import { useAuthStore } from "@/lib/auth.store";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media-url";
import { getAllJobs, getLocations } from "@/lib/catalog.api"; // Assurez-vous d'avoir ces fonctions

import {
  getProMe,
  patchProMe,
  publierMe,
  masquerMe,
  uploadMeMedia,
  type ProPrivate,
} from "@/lib/pros.api";
import { billingMe } from "@/lib/billing.api";

// Formulaire étendu avec les champs obligatoires pour la publication
type ProForm = Pick<
  ProPrivate,
  "nom_entreprise" | "description" | "telephone_appel" | "telephone_whatsapp" | "statut_en_ligne" | "metier" | "zone_geographique"
>;

export default function ProProfilPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  const [isUploading, setIsUploading] = useState(false);

  // Guard auth
  useEffect(() => {
    if (!token) router.replace("/pro/login");
  }, [token, router]);

  // 1) Données Référentiels (Pour les sélecteurs)
  const jobsQ = useQuery({ queryKey: ["jobs-all"], queryFn: getAllJobs, staleTime: Infinity });
  const locsQ = useQuery({ queryKey: ["locs-all"], queryFn: getLocations, staleTime: Infinity });

  // 2) Profil pro (privé)
  const proQ = useQuery({
    queryKey: ["pro-me"],
    queryFn: getProMe,
    enabled: !!token,
    retry: 1,
  });

  // 3) Billing (premium)
  const billingQ = useQuery({
    queryKey: ["billing-me"],
    queryFn: billingMe,
    enabled: !!token,
    retry: 1,
  });

  const isPremium = !!(billingQ.data?.is_active ?? billingQ.data?.active);
  const isWhatsAppVerified = !!proQ.data?.whatsapp_verifie;

  // 4) Form
  const { register, handleSubmit, reset, formState } = useForm<ProForm>();

  // Synchronisation des données initiales
  useEffect(() => {
    if (!proQ.data) return;
    reset({
      nom_entreprise: proQ.data.nom_entreprise ?? "",
      description: proQ.data.description ?? "",
      telephone_appel: proQ.data.telephone_appel ?? "",
      telephone_whatsapp: proQ.data.telephone_whatsapp ?? "",
      statut_en_ligne: proQ.data.statut_en_ligne ?? "ONLINE",
      // On utilise les IDs pour les selects
      metier: proQ.data.metier,
      zone_geographique: proQ.data.zone_geographique,
    });
  }, [proQ.data, reset]);

  // 5) Update profil
  const updateMutation = useMutation({
    mutationFn: (payload: Partial<ProPrivate>) => patchProMe(payload),
    onSuccess: (newData) => {
      qc.setQueryData(["pro-me"], newData);
      // Reset pour effacer l'état "dirty" du formulaire
      reset({
        nom_entreprise: newData.nom_entreprise ?? "",
        description: newData.description ?? "",
        telephone_appel: newData.telephone_appel ?? "",
        telephone_whatsapp: newData.telephone_whatsapp ?? "",
        statut_en_ligne: newData.statut_en_ligne ?? "ONLINE",
        metier: newData.metier,
        zone_geographique: newData.zone_geographique,
      });
      alert("Profil mis à jour avec succès.");
    },
    onError: () => alert("Erreur lors de la sauvegarde."),
  });

  // 6) Publier / Masquer
  const visibilityMutation = useMutation({
    mutationFn: (action: "publish" | "hide") => (action === "publish" ? publierMe() : masquerMe()),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pro-me"] });
      await qc.invalidateQueries({ queryKey: ["billing-me"] }); // Parfois lié
    },
    onError: (err: any) => {
      // Affichage de l'erreur backend (ex: "Abonnement inactif" ou "Vérifiez WhatsApp")
      const msg = err.response?.data?.detail || "Impossible de changer la visibilité.";
      alert(msg);
    },
  });

  // 7) Upload media (galerie)
  const uploadGalleryPhoto = async (file: File) => {
    setIsUploading(true);
    try {
      // Backend attend type_media dans le FormData via le serializer
      await uploadMeMedia({ file, type_media: "PHOTO" });
      alert("Photo ajoutée à la galerie.");
      // Idéalement: invalider une query qui liste les médias
    } catch {
      alert("Erreur lors de l'envoi.");
    } finally {
      setIsUploading(false);
    }
  };

  // 8) Update avatar
  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const { data } = await api.patch("/api/pros/me/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      qc.setQueryData(["pro-me"], data);
      alert("Avatar mis à jour.");
    } catch {
      alert("Erreur upload avatar.");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (values: ProForm) => {
    updateMutation.mutate({
      ...values,
      // Conversion string -> number pour les selects si nécessaire (HTML renvoie string)
      metier: Number(values.metier),
      zone_geographique: Number(values.zone_geographique),
    });
  };

  if (!token) return null;
  if (proQ.isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-zinc-500" /></div>;
  if (proQ.isError) { router.replace("/pro/login"); return null; }

  const pro = proQ.data!;
  const isVisible = !!pro.est_publie;
  const avatarSrc = mediaUrl(pro.avatar ?? null);

  // Vérification bloquante pour publication
  const canPublish = isPremium && isWhatsAppVerified && pro.metier && pro.zone_geographique;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* HEADER & VISIBILITÉ */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mon Profil Pro</h1>
          <p className="text-zinc-400 text-sm">Gérez vos informations et votre visibilité.</p>
        </div>

        <div className={`rounded-2xl border p-4 ${isVisible ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`h-3 w-3 rounded-full ${isVisible ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className={`font-semibold ${isVisible ? "text-emerald-400" : "text-zinc-400"}`}>
              {isVisible ? "Visible" : "Masqué"}
            </span>
          </div>

          <button
            onClick={() => visibilityMutation.mutate(isVisible ? "hide" : "publish")}
            disabled={visibilityMutation.isPending || (!isVisible && !canPublish)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors ${
              isVisible
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {visibilityMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            <Power size={16} />
            {isVisible ? "Masquer mon profil" : "Publier mon profil"}
          </button>

          {/* Messages d'erreur préventifs */}
          {!isVisible && (
            <div className="mt-2 space-y-1">
              {!isPremium && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle size={12} /> Abonnement requis
                </div>
              )}
              {!isWhatsAppVerified && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <Smartphone size={12} /> WhatsApp non vérifié
                </div>
              )}
              {(!pro.metier || !pro.zone_geographique) && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle size={12} /> Métier/Zone requis
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FORMULAIRE PRINCIPAL */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Informations Générales</h2>

          {/* SELECTEUR METIER (OBLIGATOIRE) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Métier *</label>
            <select
              {...register("metier", { required: true })}
              className="w-full rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">Sélectionner un métier...</option>
              {jobsQ.data?.map((j) => (
                <option key={j.id} value={j.id}>{j.nom ?? j.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Nom entreprise</label>
            <input
              {...register("nom_entreprise")}
              className="w-full rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
              placeholder="Ex: Ndiaye Couture"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Description</label>
            <textarea
              {...register("description")}
              className="w-full min-h-[120px] rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Décrivez vos services, vos horaires..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Disponibilité</label>
            <select
              {...register("statut_en_ligne")}
              className="w-full rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="ONLINE">ONLINE (Disponible)</option>
              <option value="OFFLINE">OFFLINE (Indisponible)</option>
            </select>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Localisation & Contacts</h2>

          {/* SELECTEUR ZONE (OBLIGATOIRE) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Zone (Ville/Quartier) *</label>
            <select
              {...register("zone_geographique", { required: true })}
              className="w-full rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">Sélectionner une zone...</option>
              {locsQ.data?.map((l) => (
                <option key={l.id} value={l.id}>{l.nom ?? l.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Téléphone (Appel)</label>
              <input
                {...register("telephone_appel")}
                className="w-full rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
                placeholder="77 000 00 00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">WhatsApp</label>
              <input
                {...register("telephone_whatsapp")}
                className="w-full rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
                placeholder="77 000 00 00"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
          {formState.isDirty && <span className="text-sm text-zinc-400">Modifications non enregistrées</span>}
          <button
            type="submit"
            disabled={updateMutation.isPending || !formState.isDirty}
            className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Sauvegarder
          </button>
        </div>
      </form>

      {/* AVATAR + GALERIE */}
      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon size={18} className="text-purple-400" />
          Photo & Galerie
        </h2>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-zinc-500">
                  <ImageIcon size={22} />
                </div>
              )}
            </div>
            <label className={`flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer ${isUploading ? "opacity-50" : ""}`}>
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Changer avatar
              <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </label>
          </div>

          {/* Ajout Galerie */}
          <label className={`flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer ${isUploading ? "opacity-50" : ""}`}>
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Ajouter photo galerie
            <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && uploadGalleryPhoto(e.target.files[0])} />
          </label>
        </div>
      </section>

      {/* ABONNEMENT */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent p-1">
        <div className="flex items-center justify-between rounded-xl bg-black/40 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/20 p-2 text-amber-500">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="font-semibold text-white">Abonnement Premium</div>
              <div className="text-xs text-zinc-400">
                {isPremium ? `Actif • Jours restants: ${billingQ.data?.days_left ?? "—"}` : "Passez Premium pour être visible"}
              </div>
            </div>
          </div>
          <button onClick={() => router.push("/pro/premium")} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black hover:bg-amber-400">
            {isPremium ? "Gérer" : "S'abonner"}
          </button>
        </div>
      </div>
    </main>
  );
}