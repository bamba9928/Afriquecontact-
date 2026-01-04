"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { creerAnnonce } from "@/lib/annonces.api";
import { getAllJobs, getLocations } from "@/lib/catalog.api";
import { billingMe } from "@/lib/billing.api";
import { Loader2, Send, AlertTriangle, Briefcase, Search, MapPin, Phone, FileText, LayoutGrid, Globe, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";
import Link from "next/link";

type AnnonceForm = {
  titre: string;
  type: "OFFRE" | "DEMANDE";
  categorie: string;
  zone_geographique: string;
  adresse_precise: string;
  description: string;
  telephone: string;
};

export default function NouvelleAnnoncePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  // --- 1. DATA & AUTH ---
  useEffect(() => {
    if (!token) router.replace("/pro/login");
  }, [token, router]);

  const { data: jobs } = useQuery({ queryKey: ["jobs-all"], queryFn: getAllJobs, staleTime: Infinity });
  const { data: locs } = useQuery({ queryKey: ["locs-all"], queryFn: getLocations, staleTime: Infinity });

  const { data: billing } = useQuery({
    queryKey: ["billing-me"],
    queryFn: billingMe,
    enabled: !!token
  });
  const isPremium = !!(billing?.is_active ?? billing?.active);

  // --- 2. FORM SETUP ---
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AnnonceForm>({
    defaultValues: { type: "DEMANDE" }
  });

  const typeValue = watch("type");
  const descriptionValue = watch("description") || "";

  // --- 3. MUTATION ---
  const mutation = useMutation({
    mutationFn: async (data: AnnonceForm) => {
      const payload = {
        ...data,
        categorie: parseInt(data.categorie),
        zone_geographique: parseInt(data.zone_geographique),
      };
      return creerAnnonce(payload as any);
    },
    onSuccess: () => {
      toast.success("Votre annonce est en ligne !");
      queryClient.invalidateQueries({ queryKey: ["mes-annonces"] });
      queryClient.invalidateQueries({ queryKey: ["annonces"] });
      router.push("/pro/annonces");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erreur. Vérifiez votre connexion ou les champs requis.");
    }
  });

  if (!token) return null;

  return (
    <main className="relative mx-auto max-w-3xl px-4 py-8 md:py-12">

      {/* Background Ambience */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-[#00FF00]/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="mb-8 space-y-2">
        <Link href="/pro/annonces" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm mb-4">
             <ArrowLeft size={16} /> Retour à mes annonces
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-white">
          Nouvelle Annonce
        </h1>
        <p className="text-zinc-400">
          Remplissez le formulaire ci-dessous pour publier votre besoin ou votre offre de service.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-8">

        {/* --- ÉTAPE 1 : TYPE D'ANNONCE --- */}
        <section>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Type d'annonce</label>
            <div className="grid grid-cols-2 gap-4">

            {/* Carte DEMANDE */}
            <label className={clsx(
                "cursor-pointer group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300",
                typeValue === "DEMANDE"
                ? "bg-blue-600/10 border-blue-500 ring-1 ring-blue-500"
                : "bg-zinc-900/50 border-white/5 hover:bg-zinc-800"
            )}>
                <input {...register("type")} type="radio" value="DEMANDE" className="hidden" />
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className={clsx(
                        "rounded-full p-3 transition-colors",
                        typeValue === "DEMANDE" ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-500 group-hover:text-white"
                    )}>
                        <Search size={24} strokeWidth={3} />
                    </div>
                    <div>
                        <span className={clsx("block font-bold text-lg", typeValue === "DEMANDE" ? "text-white" : "text-zinc-300")}>Je cherche</span>
                        <span className="text-xs text-zinc-500">Un artisan, un service...</span>
                    </div>
                </div>
            </label>

            {/* Carte OFFRE */}
            <label className={clsx(
                "cursor-pointer group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300",
                typeValue === "OFFRE"
                ? "bg-emerald-600/10 border-emerald-500 ring-1 ring-emerald-500"
                : "bg-zinc-900/50 border-white/5 hover:bg-zinc-800"
            )}>
                <input {...register("type")} type="radio" value="OFFRE" className="hidden" />
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className={clsx(
                        "rounded-full p-3 transition-colors",
                        typeValue === "OFFRE" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500 group-hover:text-white"
                    )}>
                        <Briefcase size={24} strokeWidth={3} />
                    </div>
                    <div>
                        <span className={clsx("block font-bold text-lg", typeValue === "OFFRE" ? "text-white" : "text-zinc-300")}>Je propose</span>
                        <span className="text-xs text-zinc-500">Mes compétences, un emploi...</span>
                    </div>
                </div>
            </label>
            </div>

            {/* Warning Premium pour les Offres */}
            <div className={clsx(
                "mt-4 overflow-hidden transition-all duration-500 ease-in-out",
                typeValue === "OFFRE" && !isPremium ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                    <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                    <div className="text-sm">
                        <p className="font-bold text-amber-500">Visibilité restreinte</p>
                        <p className="text-amber-200/80 mt-1">
                            En tant que membre gratuit, votre offre sera soumise à validation et aura une visibilité limitée.
                            <Link href="/pricing" className="underline hover:text-white ml-1">Passez Pro</Link> pour une publication instantanée.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- ÉTAPE 2 : DÉTAILS --- */}
        <section className="space-y-6 bg-zinc-900/30 p-6 md:p-8 rounded-3xl border border-white/5 backdrop-blur-sm">

            {/* Titre */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Titre de l'annonce <span className="text-red-500">*</span></label>
                <div className="relative group">
                    <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#00FF00] transition-colors">
                        <FileText size={18} />
                    </div>
                    <input
                        {...register("titre", { required: "Ce champ est obligatoire", minLength: { value: 5, message: "Trop court (min 5 caractères)" } })}
                        placeholder={typeValue === "DEMANDE" ? "Ex: Cherche Plombier urgence Mermoz" : "Ex: Service de nettoyage à domicile"}
                        className="w-full rounded-xl bg-black/50 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF00]/50 focus:ring-1 focus:ring-[#00FF00]/50 transition-all"
                    />
                </div>
                {errors.titre && <p className="text-xs text-red-400 mt-1 ml-1">{errors.titre.message}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Catégorie */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Catégorie <span className="text-red-500">*</span></label>
                    <div className="relative group">
                        <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#00FF00] transition-colors">
                            <LayoutGrid size={18} />
                        </div>
                        <select
                            {...register("categorie", { required: "Sélectionnez une catégorie" })}
                            className="w-full appearance-none rounded-xl bg-black/50 border border-white/10 pl-11 pr-10 py-3 text-white focus:outline-none focus:border-[#00FF00]/50 focus:ring-1 focus:ring-[#00FF00]/50 transition-all cursor-pointer"
                        >
                            <option value="">Choisir...</option>
                            {jobs?.map((j) => (
                                <option key={j.id} value={j.id}>{j.name || j.nom}</option>
                            ))}
                        </select>
                        {/* Custom arrow */}
                        <div className="absolute right-4 top-4 pointer-events-none">
                             <div className="h-0 w-0 border-l-[5px] border-l-transparent border-t-[6px] border-t-zinc-500 border-r-[5px] border-r-transparent" />
                        </div>
                    </div>
                    {errors.categorie && <p className="text-xs text-red-400 mt-1 ml-1">{errors.categorie.message}</p>}
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Téléphone <span className="text-red-500">*</span></label>
                    <div className="relative group">
                        <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#00FF00] transition-colors">
                            <Phone size={18} />
                        </div>
                        <input
                            {...register("telephone", {
                                required: "Requis",
                                pattern: { value: /^\+?\d{8,15}$/, message: "Format invalide" }
                            })}
                            placeholder="77 000 00 00"
                            className="w-full rounded-xl bg-black/50 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF00]/50 focus:ring-1 focus:ring-[#00FF00]/50 transition-all"
                        />
                    </div>
                    {errors.telephone && <p className="text-xs text-red-400 mt-1 ml-1">{errors.telephone.message}</p>}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Zone */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Ville / Zone <span className="text-red-500">*</span></label>
                    <div className="relative group">
                        <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#00FF00] transition-colors">
                            <Globe size={18} />
                        </div>
                        <select
                            {...register("zone_geographique", { required: "Sélectionnez une zone" })}
                            className="w-full appearance-none rounded-xl bg-black/50 border border-white/10 pl-11 pr-10 py-3 text-white focus:outline-none focus:border-[#00FF00]/50 focus:ring-1 focus:ring-[#00FF00]/50 transition-all cursor-pointer"
                        >
                            <option value="">Choisir...</option>
                            {locs?.map((l) => (
                                <option key={l.id} value={l.id}>{l.name || l.nom}</option>
                            ))}
                        </select>
                         <div className="absolute right-4 top-4 pointer-events-none">
                             <div className="h-0 w-0 border-l-[5px] border-l-transparent border-t-[6px] border-t-zinc-500 border-r-[5px] border-r-transparent" />
                        </div>
                    </div>
                    {errors.zone_geographique && <p className="text-xs text-red-400 mt-1 ml-1">{errors.zone_geographique.message}</p>}
                </div>

                {/* Adresse */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Quartier / Précision</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#00FF00] transition-colors">
                            <MapPin size={18} />
                        </div>
                        <input
                            {...register("adresse_precise")}
                            placeholder="Ex: Parcelles Assainies U26"
                            className="w-full rounded-xl bg-black/50 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF00]/50 focus:ring-1 focus:ring-[#00FF00]/50 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Description détaillée <span className="text-red-500">*</span></label>
                    <span className={clsx("text-xs font-medium", descriptionValue.length < 30 ? "text-red-400" : "text-[#00FF00]")}>
                        {descriptionValue.length} / 30 min
                    </span>
                </div>
                <textarea
                    {...register("description", {
                        required: "Décrivez votre besoin",
                        minLength: { value: 30, message: "La description est trop courte (min 30 car.)" }
                    })}
                    rows={5}
                    placeholder="Dites-nous en plus sur votre besoin..."
                    className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF00]/50 focus:ring-1 focus:ring-[#00FF00]/50 transition-all resize-none leading-relaxed"
                />
                {errors.description && <p className="text-xs text-red-400 mt-1 ml-1">{errors.description.message}</p>}
            </div>

        </section>

        {/* --- FOOTER ACTIONS --- */}
        <div className="pt-4">
            <button
                type="submit"
                disabled={mutation.isPending}
                className={clsx(
                    "w-full flex items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed",
                    typeValue === "OFFRE"
                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
                        : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20"
                )}
            >
                {mutation.isPending ? (
                    <>
                        <Loader2 className="animate-spin" /> Publication...
                    </>
                ) : (
                    <>
                        <Send size={20} />
                        {typeValue === "OFFRE" ? "Publier mon Offre" : "Publier ma Demande"}
                    </>
                )}
            </button>
            <p className="text-center text-xs text-zinc-500 mt-4">
                En publiant, vous acceptez nos conditions d'utilisation.
            </p>
        </div>

      </form>
    </main>
  );
}