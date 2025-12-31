"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { creerAnnonce } from "@/lib/annonces.api";
import { getAllJobs, getLocations } from "@/lib/catalog.api";
import { billingMe } from "@/lib/billing.api";
import { Loader2, Send, AlertCircle, Briefcase, Search, MapPin } from "lucide-react";
import { toast } from "sonner";

type AnnonceForm = {
  titre: string;
  type: "OFFRE" | "DEMANDE";
  categorie: string; // ID envoyé en string par le select HTML
  zone_geographique: string; // ID envoyé en string
  adresse_precise: string;
  description: string;
  telephone: string;
};

export default function NouvelleAnnoncePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  // 1. Redirection si non connecté
  useEffect(() => {
    if (!token) router.replace("/pro/login");
  }, [token, router]);

  // 2. Chargement des données référentielles (Catégories & Zones)
  const { data: jobs } = useQuery({ queryKey: ["jobs-all"], queryFn: getAllJobs, staleTime: Infinity });
  const { data: locs } = useQuery({ queryKey: ["locs-all"], queryFn: getLocations, staleTime: Infinity });

  // 3. Vérification Premium (pour les offres)
  const { data: billing } = useQuery({
    queryKey: ["billing-me"],
    queryFn: billingMe,
    enabled: !!token
  });
  const isPremium = !!(billing?.is_active ?? billing?.active);

  // 4. Gestion du Formulaire
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AnnonceForm>({
    defaultValues: { type: "DEMANDE" }
  });

  const typeValue = watch("type");

  // 5. Mutation d'envoi
  const mutation = useMutation({
    mutationFn: async (data: AnnonceForm) => {
      // Construction du payload exact attendu par Django
      const payload = {
        titre: data.titre,
        type: data.type, // "OFFRE" ou "DEMANDE"
        description: data.description,
        telephone: data.telephone,
        adresse_precise: data.adresse_precise,
        // Conversion des IDs
        categorie: parseInt(data.categorie),
        zone_geographique: parseInt(data.zone_geographique),
      };

      return creerAnnonce(payload as any);
    },
    onSuccess: () => {
      toast.success("Annonce publiée avec succès !");
      queryClient.invalidateQueries({ queryKey: ["mes-annonces"] });
      queryClient.invalidateQueries({ queryKey: ["annonces"] });
      router.push("/pro/annonces");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erreur lors de la publication. Vérifiez que tous les champs sont remplis.");
    }
  });

  if (!token) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Nouvelle Annonce</h1>
        <p className="text-zinc-400 text-sm">
          Publiez une offre ou une demande visible par toute la communauté.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">

        {/* SÉLECTEUR DE TYPE */}
        <div className="grid grid-cols-2 gap-4 p-1 bg-zinc-900 rounded-2xl border border-white/10">
          <label className={`cursor-pointer rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
            typeValue === "DEMANDE" ? "bg-blue-600 text-white shadow-lg" : "hover:bg-white/5 text-zinc-400"
          }`}>
            <input {...register("type")} type="radio" value="DEMANDE" className="hidden" />
            <Search size={24} />
            <span className="font-bold text-sm">Demande</span>
            <span className="text-[10px] opacity-70">Je cherche un service</span>
          </label>

          <label className={`cursor-pointer rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
            typeValue === "OFFRE" ? "bg-emerald-600 text-white shadow-lg" : "hover:bg-white/5 text-zinc-400"
          }`}>
            <input {...register("type")} type="radio" value="OFFRE" className="hidden" />
            <Briefcase size={24} />
            <span className="font-bold text-sm">Offre</span>
            <span className="text-[10px] opacity-70">Je propose un service</span>
          </label>
        </div>

        {/* Alerte Premium pour les Offres */}
        {typeValue === "OFFRE" && !isPremium && (
          <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-400 border border-amber-500/20">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Attention, compte Premium requis</p>
              <p className="opacity-80">
                Vous pouvez rédiger votre offre, mais elle ne sera visible publiquement que si votre abonnement Pro est actif.
              </p>
            </div>
          </div>
        )}

        {/* CHAMPS FORMULAIRE */}
        <div className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/50 p-6">

          {/* Titre */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Titre de l'annonce *</label>
            <input
              {...register("titre", { required: "Le titre est requis", minLength: { value: 5, message: "Min 5 caractères" } })}
              className="w-full rounded-xl bg-black border border-white/10 px-4 py-3 outline-none focus:border-indigo-500 transition-colors"
              placeholder={typeValue === "DEMANDE" ? "Ex: Cherche Plombier urgence Mermoz" : "Ex: Service de nettoyage à domicile"}
            />
            {errors.titre && <span className="text-xs text-red-400">{errors.titre.message}</span>}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Catégorie (API) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Secteur d'activité *</label>
              <select
                {...register("categorie", { required: "Catégorie requise" })}
                className="w-full appearance-none rounded-xl bg-black border border-white/10 px-4 py-3 outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Sélectionner...</option>
                {jobs?.map((j) => (
                  <option key={j.id} value={j.id}>{j.name || j.nom}</option>
                ))}
              </select>
              {errors.categorie && <span className="text-xs text-red-400">{errors.categorie.message}</span>}
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Téléphone contact *</label>
              <input
                {...register("telephone", {
                    required: "Téléphone requis",
                    pattern: { value: /^\+?\d{8,15}$/, message: "Format invalide" }
                })}
                className="w-full rounded-xl bg-black border border-white/10 px-4 py-3 outline-none focus:border-indigo-500 transition-colors"
                placeholder="77 000 00 00"
              />
               {errors.telephone && <span className="text-xs text-red-400">{errors.telephone.message}</span>}
            </div>
          </div>

          {/* Localisation */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Zone (API) */}
             <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ville / Zone *</label>
              <select
                {...register("zone_geographique", { required: "Zone requise" })}
                className="w-full appearance-none rounded-xl bg-black border border-white/10 px-4 py-3 outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Sélectionner une ville...</option>
                {locs?.map((l) => (
                  <option key={l.id} value={l.id}>{l.name || l.nom}</option>
                ))}
              </select>
              {errors.zone_geographique && <span className="text-xs text-red-400">{errors.zone_geographique.message}</span>}
            </div>

            {/* Adresse Précise */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Précision (Quartier)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-zinc-600" />
                <input
                    {...register("adresse_precise")}
                    className="w-full rounded-xl bg-black border border-white/10 pl-9 pr-4 py-3 outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Ex: Près de la mosquée..."
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Description détaillée *</label>
            <textarea
              {...register("description", {
                  required: "Description requise",
                  minLength: { value: 30, message: "Au moins 30 caractères pour être validé." }
              })}
              className="w-full min-h-[150px] rounded-xl bg-black border border-white/10 px-4 py-3 outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
              placeholder="Décrivez précisément votre besoin ou ce que vous proposez..."
            />
            {errors.description && <span className="text-xs text-red-400">{errors.description.message}</span>}
          </div>
        </div>

        {/* BOUTON SOUMETTRE */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-white transition-all shadow-lg shadow-white/5 ${
            typeValue === "OFFRE" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {mutation.isPending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          {typeValue === "OFFRE" ? "Publier l'offre" : "Publier la demande"}
        </button>

      </form>
    </main>
  );
}