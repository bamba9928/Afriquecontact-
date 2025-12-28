"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { getProMe, patchProMe, publierMe, masquerMe, uploadMeMedia, type ProPrivate } from "@/lib/pros.api"; // Assurez-vous d'exporter ProPrivate
import { Loader2, Save, Upload, Power, CreditCard, Image as ImageIcon, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner"; // Optionnel: pour les notifications, sinon utilisez alert() ou un état local

export default function ProProfilPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // 1. Récupération des données (Auto-refetch, Cache)
  const { data: pro, isLoading, isError } = useQuery({
    queryKey: ["pro-me"],
    queryFn: getProMe,
    retry: 1,
  });

  // 2. Gestion du Formulaire
  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<ProPrivate>();

  // Synchroniser le formulaire quand les données arrivent
  useEffect(() => {
    if (pro) reset(pro);
  }, [pro, reset]);

  // Redirection si erreur (ex: token expiré)
  useEffect(() => {
    if (isError) router.replace("/pro/login");
  }, [isError, router]);

  // 3. Mutations (Actions)
  const updateMutation = useMutation({
    mutationFn: patchProMe,
    onSuccess: (newData) => {
      queryClient.setQueryData(["pro-me"], newData); // Mise à jour immédiate du cache
      reset(newData); // Reset l'état "dirty" du formulaire
      alert("Profil mis à jour avec succès !");
    },
    onError: () => alert("Erreur lors de la sauvegarde."),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: "online" | "offline") =>
      newStatus === "online" ? publierMe() : masquerMe(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-me"] });
    },
  });

  const uploadMutation = async (file: File) => {
    setIsUploading(true);
    try {
      await uploadMeMedia(file);
      await queryClient.invalidateQueries({ queryKey: ["pro-me"] }); // Rafraîchir pour voir la nouvelle image
      alert("Média ajouté !");
    } catch (e) {
      alert("Erreur lors de l'envoi.");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data: Partial<ProPrivate>) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-zinc-500" /></div>;

  const isPremium = pro?.billing?.is_active; // Suppose que votre API renvoie l'état billing

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">

      {/* HEADER & STATUT */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mon Profil Pro</h1>
          <p className="text-zinc-400 text-sm">Gérez vos informations et votre visibilité.</p>
        </div>

        {/* Widget de Statut */}
        <div className={`rounded-2xl border p-4 ${pro?.est_en_ligne ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`h-3 w-3 rounded-full ${pro?.est_en_ligne ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className={`font-semibold ${pro?.est_en_ligne ? "text-emerald-400" : "text-zinc-400"}`}>
              {pro?.est_en_ligne ? "En Ligne" : "Hors Ligne"}
            </span>
          </div>

          <button
            onClick={() => statusMutation.mutate(pro?.est_en_ligne ? "offline" : "online")}
            disabled={statusMutation.isPending || (!isPremium && !pro?.est_en_ligne)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors ${
              pro?.est_en_ligne
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {statusMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            <Power size={16} />
            {pro?.est_en_ligne ? "Masquer mon profil" : "Publier mon profil"}
          </button>

          {/* Alerte si pas payé */}
          {!isPremium && !pro?.est_en_ligne && (
            <div className="mt-2 flex items-start gap-2 text-xs text-amber-400">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>Abonnement requis pour publier.</span>
            </div>
          )}
        </div>
      </div>

      {/* FORMULAIRE PRINCIPAL */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Section Identité */}
        <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle size={18} className="text-indigo-400" />
            Informations Générales
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Nom Commercial</label>
            <input
              {...register("nom_commercial")}
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
        </section>

        {/* Section Contacts */}
        <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Contacts</h2>
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

        {/* Barre d'action flottante (si modif) ou fixe */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
          {isDirty && <span className="text-sm text-zinc-400">Modifications non enregistrées</span>}
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Sauvegarder
          </button>
        </div>
      </form>

      {/* SECTION MÉDIAS */}
      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon size={18} className="text-purple-400" />
            Galerie & Photo
          </h2>
          <label className={`flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer ${isUploading ? "opacity-50" : ""}`}>
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Ajouter une photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadMutation(f);
              }}
            />
          </label>
        </div>

        {/* Aperçu Photo Principale */}
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {pro?.photo_url ? (
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-white/20">
              <img src={pro.photo_url} alt="Profil" className="h-full w-full object-cover" />
              <div className="absolute bottom-0 w-full bg-black/60 p-1 text-center text-[10px] text-white">Principale</div>
            </div>
          ) : (
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-zinc-500">
              <ImageIcon size={24} />
            </div>
          )}
          {/* Si votre API renvoie d'autres images, map-ez les ici */}
        </div>
      </section>

      {/* FOOTER : Abonnement */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent p-1">
        <div className="flex items-center justify-between rounded-xl bg-black/40 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="rounded-full bg-amber-500/20 p-2 text-amber-500">
               <CreditCard size={20} />
             </div>
             <div>
               <div className="font-semibold text-white">Abonnement Premium</div>
               <div className="text-xs text-zinc-400">
                 {isPremium
                   ? `Actif jusqu'au ${new Date(pro.billing?.expires_at ?? "").toLocaleDateString()}`
                   : "Passez Pro pour être visible partout"}
               </div>
             </div>
          </div>
          <button
            onClick={() => router.push("/pro/premium")}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black hover:bg-amber-400"
          >
            {isPremium ? "Gérer" : "S'abonner"}
          </button>
        </div>
      </div>

    </main>
  );
}