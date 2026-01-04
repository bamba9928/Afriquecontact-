"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, Upload, Power, CreditCard,
  Image as ImageIcon, AlertTriangle, Smartphone,
  FileText, Trash2, Share2, Eye, Video
} from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/auth.store";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media-url";
import { getAllJobs, getLocations } from "@/lib/catalog.api";

import {
  getProMe,
  patchProMe,
  publierMe,
  masquerMe,
  uploadMeMedia,
  type ProPrivate,
} from "@/lib/pros.api";
import { billingMe } from "@/lib/billing.api";

// Formulaire : on reprend les champs éditables de ProPrivate
type ProForm = Pick<
  ProPrivate,
  "nom_entreprise" | "description" | "telephone_appel" | "telephone_whatsapp" | "statut_en_ligne" | "metier" | "zone_geographique"
>;

export default function ProProfilPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  const [isUploading, setIsUploading] = useState(false);

  // 0. Redirection si non connecté
  useEffect(() => {
    if (!token) router.replace("/pro/login");
  }, [token, router]);

  // 1. Données Référentiels
  // ✅ CORRECTION: On passe une arrow function pour éviter que React Query ne passe ses métadonnées en arguments
  const jobsQ = useQuery({ queryKey: ["jobs-all"], queryFn: () => getAllJobs(), staleTime: Infinity });
  const locsQ = useQuery({ queryKey: ["locs-all"], queryFn: () => getLocations(), staleTime: Infinity });

  // 2. Profil pro (privé)
  const proQ = useQuery({
    queryKey: ["pro-me"],
    queryFn: getProMe,
    enabled: !!token,
  });
  const pro = proQ.data;

  // 3. Billing (pour vérifier le statut Premium)
  const billingQ = useQuery({
    queryKey: ["billing-me"],
    queryFn: billingMe,
    enabled: !!token,
  });

  // Logique métier pour l'affichage
  const isPremium = !!(billingQ.data?.is_active ?? billingQ.data?.active);
  const isWhatsAppVerified = !!pro?.whatsapp_verifie;
  const isVisible = !!pro?.est_publie;
  const canPublish = isPremium && isWhatsAppVerified && pro?.metier && pro?.zone_geographique;

  // URL Avatar
  const avatarSrc = mediaUrl(pro?.avatar ?? null);

  // 4. Gestion du Formulaire
  const { register, handleSubmit, reset, formState } = useForm<ProForm>();

  // Synchronisation du formulaire avec les données reçues
  useEffect(() => {
    if (!pro) return;
    reset({
      nom_entreprise: pro.nom_entreprise ?? "",
      description: pro.description ?? "",
      telephone_appel: pro.telephone_appel ?? "",
      telephone_whatsapp: pro.telephone_whatsapp ?? "",
      statut_en_ligne: pro.statut_en_ligne ?? "ONLINE",
      metier: pro.metier,
      zone_geographique: pro.zone_geographique,
    });
  }, [pro, reset]);

  // 5. Mutation : Mise à jour infos
  const updateMutation = useMutation({
    mutationFn: (payload: Partial<ProPrivate>) => patchProMe(payload),
    onSuccess: (newData) => {
      qc.setQueryData(["pro-me"], newData);
      reset(newData as any);
      toast.success("Profil mis à jour avec succès.");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde."),
  });

  // 6. Mutation : Visibilité (Publier / Masquer)
  const visibilityMutation = useMutation({
    mutationFn: (action: "publish" | "hide") => (action === "publish" ? publierMe() : masquerMe()),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pro-me"] });
      toast.success("Visibilité mise à jour.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "Impossible de changer la visibilité.";
      toast.error(msg);
    },
  });

  // 7. Mutation : Upload Media (Générique)
  const handleUploadMedia = async (file: File, type: "PHOTO" | "VIDEO" | "CV") => {
    setIsUploading(true);
    try {
      await uploadMeMedia({ file, type_media: type });
      await qc.invalidateQueries({ queryKey: ["pro-me"] });
      toast.success(`${type === 'CV' ? 'CV' : 'Média'} ajouté.`);
    } catch {
      toast.error("Erreur lors de l'envoi du fichier.");
    } finally {
      setIsUploading(false);
    }
  };

  // 8. Mutation : Delete Media
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: number) => {
        // Suppression via l'API directe (Endpoint à vérifier côté backend)
        await api.delete(`/api/pros/me/media/${mediaId}/`);
    },
    onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["pro-me"] });
        toast.success("Fichier supprimé.");
    },
    onError: () => toast.error("Erreur lors de la suppression.")
  });

  // 9. Mutation : Upload Avatar
  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      // Patch multipart spécifique pour l'avatar
      const { data } = await api.patch("/api/pros/me/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      qc.setQueryData(["pro-me"], data);
      toast.success("Photo de profil mise à jour.");
    } catch {
      toast.error("Erreur lors de l'upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // 10. Fonction Partage
  const handleShare = () => {
    if (!pro) return;
    const shareText = `Vous cherchez un ${pro.metier_name || "pro"} ? Contactez ${pro.nom_entreprise} sur SénégalContact !`;
    const shareUrl = `${window.location.origin}/pros/${pro.slug || pro.id}`;

    if (navigator.share) {
      navigator.share({ title: pro.nom_entreprise, text: shareText, url: shareUrl }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  // Submit Handler
  const onSubmit = (values: ProForm) => {
    updateMutation.mutate({
      ...values,
      metier: Number(values.metier),
      zone_geographique: Number(values.zone_geographique),
    });
  };

  // Loading / Auth states
  if (!token) return null;
  if (proQ.isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-zinc-500" /></div>;
  if (proQ.isError) {
    // Si erreur (ex: 401), on redirige
    router.replace("/pro/login");
    return null;
  }

  // Filtrage des médias pour l'affichage
  const cvList = pro?.medias?.filter((m: any) => m.type_media === 'CV') ?? [];
  const galleryList = pro?.medias?.filter((m: any) => m.type_media === 'PHOTO' || m.type_media === 'VIDEO') ?? [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8 pb-32">

      {/* --- EN-TÊTE --- */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Mon Profil Pro</h1>
          <p className="text-zinc-400 text-sm">Gérez vos informations, votre galerie et votre visibilité.</p>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
             <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 px-4 text-sm font-medium hover:bg-white/10 transition-colors"
             >
                <Share2 size={16} /> Partager mon profil
             </button>

            {/* Carte Visibilité / Statut */}
            <div className={`rounded-2xl border p-4 transition-colors ${isVisible ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-zinc-900"}`}>
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${isVisible ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                        <span className={`font-semibold text-sm ${isVisible ? "text-emerald-400" : "text-zinc-400"}`}>
                        {isVisible ? "Profil Public (En ligne)" : "Profil Masqué"}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => visibilityMutation.mutate(isVisible ? "hide" : "publish")}
                    disabled={visibilityMutation.isPending || (!isVisible && !canPublish)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 px-6 text-sm font-bold transition-all shadow-lg ${
                    isVisible
                        ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                >
                    {visibilityMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                    <Power size={16} />
                    {isVisible ? "Masquer" : "Publier maintenant"}
                </button>

                {/* Alertes bloquantes pour la publication */}
                {!isVisible && (
                    <div className="mt-3 space-y-2 border-t border-white/5 pt-2">
                        {!isPremium && (
                            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-1.5 rounded-lg">
                            <CreditCard size={12} /> Abonnement requis
                            </div>
                        )}
                        {!isWhatsAppVerified && (
                            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-1.5 rounded-lg">
                            <Smartphone size={12} /> WhatsApp non vérifié
                            </div>
                        )}
                        {(!pro?.metier || !pro?.zone_geographique) && (
                            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-1.5 rounded-lg">
                            <AlertTriangle size={12} /> Informations incomplètes
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* --- FORMULAIRE --- */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
            {/* Section Gauche : Identité */}
            <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white border-b border-white/5 pb-2">Informations Générales</h2>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Métier *</label>
                    <select
                        {...register("metier", { required: true })}
                        className="w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
                    >
                        <option value="">-- Sélectionner --</option>
                        {jobsQ.data?.map((j) => (
                            <option key={j.id} value={j.id}>{j.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Nom commercial / Enseigne</label>
                    <input
                        {...register("nom_entreprise")}
                        className="w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
                        placeholder="Ex: Diop Plomberie Services"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Description</label>
                    <textarea
                        {...register("description")}
                        className="w-full min-h-[120px] rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors resize-none"
                        placeholder="Décrivez vos services, votre expérience..."
                    />
                </div>
            </section>

            {/* Section Droite : Contact & Localisation */}
            <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white border-b border-white/5 pb-2">Localisation & Contacts</h2>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Ville / Zone *</label>
                    <select
                        {...register("zone_geographique", { required: true })}
                        className="w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
                    >
                        <option value="">-- Sélectionner --</option>
                        {locsQ.data?.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Téléphone (Appels)</label>
                    <input
                        {...register("telephone_appel")}
                        type="tel"
                        className="w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
                        placeholder="Ex: 77 123 45 67"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">WhatsApp</label>
                    <input
                        {...register("telephone_whatsapp")}
                        type="tel"
                        className="w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
                        placeholder="Ex: 77 123 45 67"
                    />
                </div>

                {/* Switch Disponibilité */}
                <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-medium text-zinc-400">Disponibilité actuelle</label>
                    <div className="flex gap-2">
                        <label className="flex-1 cursor-pointer">
                            <input type="radio" value="ONLINE" {...register("statut_en_ligne")} className="peer hidden" />
                            <div className="rounded-xl border border-white/10 bg-black py-2 text-center text-sm peer-checked:bg-emerald-500/20 peer-checked:text-emerald-400 peer-checked:border-emerald-500/50 transition-all flex items-center justify-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Disponible
                            </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                            <input type="radio" value="OFFLINE" {...register("statut_en_ligne")} className="peer hidden" />
                            <div className="rounded-xl border border-white/10 bg-black py-2 text-center text-sm peer-checked:bg-red-500/20 peer-checked:text-red-400 peer-checked:border-red-500/50 transition-all flex items-center justify-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500" /> Indisponible
                            </div>
                        </label>
                    </div>
                </div>
            </section>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending || !formState.isDirty}
            className="flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-bold text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-white/5"
          >
            {updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Enregistrer les modifications
          </button>
        </div>
      </form>

      {/* --- GESTION MÉDIAS --- */}
      <section className="space-y-6 pt-6 border-t border-white/5">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="text-indigo-400"/> Galerie & Documents
         </h2>

         <div className="grid md:grid-cols-2 gap-6">
            {/* 1. Avatar */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5 flex flex-col items-center justify-center gap-4">
                <div className="relative h-32 w-32 rounded-full overflow-hidden border-2 border-white/10 bg-black shadow-2xl">
                    {avatarSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-600 bg-zinc-800">
                            <ImageIcon size={32} />
                        </div>
                    )}
                </div>
                <label className={`flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 cursor-pointer transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Changer photo de profil
                    <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                </label>
            </div>

            {/* 2. CV */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white flex items-center gap-2"><FileText size={16}/> Mon CV</h3>
                    <label className={`text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-indigo-500/30 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                         {isUploading ? "Envoi..." : "+ Ajouter CV (PDF)"}
                         <input type="file" accept="application/pdf" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && handleUploadMedia(e.target.files[0], "CV")} />
                    </label>
                </div>

                <div className="flex-1 flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                    {cvList.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-xl h-full">
                            Aucun CV ajouté
                        </div>
                    ) : (
                        cvList.map((cv: any) => (
                            <div key={cv.id} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                                        <FileText size={18} />
                                    </div>
                                    <span className="text-xs truncate text-zinc-300">Document CV</span>
                                </div>
                                <div className="flex gap-2">
                                    <a href={mediaUrl(cv.fichier)} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 transition-colors"><Eye size={14}/></a>
                                    <button onClick={() => deleteMediaMutation.mutate(cv.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
         </div>

         {/* 3. Galerie */}
         <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                 <h3 className="font-semibold text-white flex items-center gap-2"><ImageIcon size={16}/> Réalisations</h3>
                 <div className="flex gap-2">
                     <label className={`text-xs bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 flex items-center gap-2 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                         <Upload size={12}/> Photo
                         <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && handleUploadMedia(e.target.files[0], "PHOTO")} />
                     </label>
                     <label className={`text-xs bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 flex items-center gap-2 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                         <Video size={12}/> Vidéo
                         <input type="file" accept="video/*" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && handleUploadMedia(e.target.files[0], "VIDEO")} />
                     </label>
                 </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {galleryList.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-sm text-zinc-500 border border-dashed border-white/10 rounded-xl bg-black/20">
                        <Upload className="mx-auto mb-2 opacity-50" />
                        Ajoutez des photos ou vidéos pour montrer votre travail.
                    </div>
                ) : (
                    galleryList.map((m: any) => (
                        <div key={m.id} className="relative group aspect-square bg-black rounded-xl overflow-hidden border border-white/10">
                            {m.type_media === 'VIDEO' ? (
                                <video src={mediaUrl(m.fichier)} className="h-full w-full object-cover opacity-80" />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={mediaUrl(m.fichier)} alt="Realisation" className="h-full w-full object-cover" />
                            )}

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                <a href={mediaUrl(m.fichier)} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><Eye size={16}/></a>
                                <button onClick={() => deleteMediaMutation.mutate(m.id)} className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/40 text-red-400 transition-colors"><Trash2 size={16}/></button>
                            </div>

                            {/* Badge Type */}
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-md uppercase tracking-wider">
                                {m.type_media}
                            </div>
                        </div>
                    ))
                )}
            </div>
         </div>
      </section>

      {/* --- BANDEAU ABONNEMENT (Si pas premium) --- */}
      {!isPremium && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-600 to-amber-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-xl shadow-amber-900/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
               <CreditCard size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Activez votre compte Pro</h3>
              <p className="text-amber-100 text-sm">Abonnement requis pour être contacté (1000 FCFA/mois).</p>
            </div>
          </div>
          <button onClick={() => router.push("/pro/premium")} className="whitespace-nowrap rounded-xl bg-white text-amber-700 px-6 py-3 font-bold hover:bg-amber-50 transition-colors shadow-lg">
             Payer 1000 FCFA
          </button>
        </div>
      )}
    </main>
  );
}