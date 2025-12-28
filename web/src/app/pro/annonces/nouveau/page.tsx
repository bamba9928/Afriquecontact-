"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { creerAnnonce } from "@/lib/annonces.api"; // Assurez-vous que cette fonction accepte FormData
import { Loader2, Upload, AlertCircle, Briefcase, Search, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

// Liste des catégories basée sur votre Cahier des Charges [cite: 111-123]
const CATEGORIES = [
  "Numérique & TIC",
  "Énergies Renouvelables",
  "Agrobusiness",
  "BTP & Urbanisme",
  "E-commerce & Logistique",
  "Santé & Bien-être",
  "Immobilier & Parking",
  "Gestion, Finance, Juridique",
  "Commercial & Marketing",
  "Technique & Industriel",
  "Hôtellerie & Tourisme",
  "Éducation & Formation",
  "Autre"
];

type AnnonceForm = {
  titre: string;
  type: "offre" | "demande";
  prix?: number;
  ville: string;
  categorie: string;
  description: string;
  telephone?: string;
  photo?: FileList;
};

export default function NouvelleAnnoncePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Redirection si non connecté
  useEffect(() => {
    if (!token) router.replace("/pro/login");
  }, [token, router]);

  // Hook Form pour la gestion facile
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AnnonceForm>({
    defaultValues: { type: "demande", ville: "Dakar" }
  });

  const typeValue = watch("type"); // Pour changer la couleur du UI dynamiquement

  // Mutation
  const mutation = useMutation({
    mutationFn: async (data: AnnonceForm) => {
      const fd = new FormData();
      fd.append("titre", data.titre);
      fd.append("type", data.type);
      fd.append("ville", data.ville);
      fd.append("categorie", data.categorie);
      fd.append("description", data.description);
      if (data.prix) fd.append("prix", String(data.prix));
      if (data.telephone) fd.append("telephone", data.telephone);

      // Gestion fichier
      if (data.photo && data.photo[0]) {
        fd.append("photo_principale", data.photo[0]);
      }

      // Note: Assurez-vous que votre fonction 'creerAnnonce' utilise axios.post(url, fd)
      return creerAnnonce(fd as any);
    },
    onSuccess: () => {
      toast.success("Annonce publiée avec succès !");
      queryClient.invalidateQueries({ queryKey: ["mes-annonces"] });
      router.push("/pro/annonces");
    },
    onError: () => {
      toast.error("Erreur lors de la publication. Vérifiez vos champs.");
    }
  });

  if (!token) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Nouvelle Annonce</h1>
        <p className="text-zinc-400 text-sm">
          Remplissez les détails pour publier votre offre ou demande.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">

        {/* SÉLECTEUR DE TYPE (Offre vs Demande) */}
        <div className="grid grid-cols-2 gap-4 p-1 bg-white/5 rounded-2xl border border-white/10">
          <label className={`cursor-pointer rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${
            typeValue === "demande" ? "bg-blue-500 text-white shadow-lg" : "hover:bg-white/5 text-zinc-400"
          }`}>
            <input {...register("type")} type="radio" value="demande" className="hidden" />
            <Search size={20} />
            <span className="font-semibold text-sm">Demande</span>
          </label>

          <label className={`cursor-pointer rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${
            typeValue === "offre" ? "bg-emerald-500 text-white shadow-lg" : "hover:bg-white/5 text-zinc-400"
          }`}>
            <input {...register("type")} type="radio" value="offre" className="hidden" />
            <Briefcase size={20} />
            <span className="font-semibold text-sm">Offre</span>
          </label>
        </div>

        {/* Message d'avertissement pour les Offres  */}
        {typeValue === "offre" && (
          <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-400 border border-amber-500/20">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>
              Note : Pour publier une offre commerciale, votre abonnement Pro doit être actif.
              Les demandes d'emploi ou de service sont gratuites[cite: 198].
            </p>
          </div>
        )}

        {/* CHAMPS PRINCIPAUX */}
        <div className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-5">

          {/* Titre */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Titre de l'annonce *</label>
            <input
              {...register("titre", { required: "Le titre est requis" })}
              className="w-full rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
              placeholder={typeValue === "demande" ? "Ex: Recherche Plombier à Mermoz" : "Ex: Vends Générateur Solaire"}
            />
            {errors.titre && <span className="text-xs text-red-400">{errors.titre.message}</span>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Catégorie */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Catégorie *</label>
              <select
                {...register("categorie", { required: true })}
                className="w-full appearance-none rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Choisir...</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Prix */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Prix / Budget (FCFA)</label>
              <input
                type="number"
                {...register("prix")}
                className="w-full rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
                placeholder="Ex: 50000"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Ville */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Ville / Quartier *</label>
              <input
                {...register("ville", { required: "Ville requise" })}
                className="w-full rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
                placeholder="Ex: Dakar, Yoff"
              />
            </div>

            {/* Téléphone (Spécifique à l'annonce si différent du profil) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Téléphone contact</label>
              <input
                {...register("telephone")}
                className="w-full rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
                placeholder="Optionnel"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Description détaillée *</label>
            <textarea
              {...register("description", { required: "Description requise" })}
              className="w-full min-h-[120px] rounded-xl bg-black border border-white/10 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Donnez tous les détails utiles..."
            />
            {errors.description && <span className="text-xs text-red-400">{errors.description.message}</span>}
          </div>
        </div>

        {/* UPLOAD PHOTO */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">Photo (Optionnel)</label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 transition-colors hover:bg-white/10 hover:border-white/40">
            {imagePreview ? (
              <div className="relative h-40 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Aperçu" className="h-full w-full object-contain" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity">
                  Changer
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-full bg-white/10 p-4 mb-3">
                  <ImageIcon className="h-6 w-6 text-zinc-400" />
                </div>
                <div className="text-sm font-medium">Cliquez pour ajouter une image</div>
                <div className="text-xs text-zinc-500 mt-1">JPG, PNG (Max 5Mo)</div>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              {...register("photo", {
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) setImagePreview(URL.createObjectURL(file));
                }
              })}
            />
          </label>
        </div>

        {/* BUTTON SUBMIT */}
        <button
          disabled={mutation.isPending}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition-all ${
            typeValue === "offre" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {mutation.isPending ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
          Publier {typeValue === "offre" ? "l'offre" : "la demande"}
        </button>

      </form>
    </main>
  );
}