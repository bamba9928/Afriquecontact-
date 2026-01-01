"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, Upload, Power, CreditCard,
  Image as ImageIcon, AlertTriangle, Smartphone,
  FileText, Video, Trash2, Share2, Eye
} from "lucide-react";

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
import { toast } from "sonner";

// Formulaire étendu
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

  // 1) Données Référentiels
  const jobsQ = useQuery({ queryKey: ["jobs-all"], queryFn: getAllJobs, staleTime: Infinity });
  const locsQ = useQuery({ queryKey: ["locs-all"], queryFn: getLocations, staleTime: Infinity });

  // 2) Profil pro (privé)
  const proQ = useQuery({
    queryKey: ["pro-me"],
    queryFn: getProMe,
    enabled: !!token,
  });

  // 3) Billing (premium)
  const billingQ = useQuery({
    queryKey: ["billing-me"],
    queryFn: billingMe,
    enabled: !!token,
  });

  const isPremium = !!(billingQ.data?.is_active ?? billingQ.data?.active);
  const isWhatsAppVerified = !!proQ.data?.whatsapp_verifie;
  const pro = proQ.data;

  // 4) Form
  const { register, handleSubmit, reset, formState } = useForm<ProForm>();

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

  // 5) Update profil
  const updateMutation = useMutation({
    mutationFn: (payload: Partial<ProPrivate>) => patchProMe(payload),
    onSuccess: (newData) => {
      qc.setQueryData(["pro-me"], newData);
      reset(newData as any); // Reset form dirty state
      toast.success("Profil mis à jour avec succès.");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde."),
  });

  // 6) Publier / Masquer
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

  // 7) Upload Media (Générique)
  const handleUploadMedia = async (file: File, type: "PHOTO" | "VIDEO" | "CV") => {
    setIsUploading(true);
    try {
      await uploadMeMedia({ file, type_media: type });
      await qc.invalidateQueries({ queryKey: ["pro-me"] });
      toast.success(`${type} ajouté avec succès.`);
    } catch {
      toast.error("Erreur lors de l'envoi du fichier.");
    } finally {
      setIsUploading(false);
    }
  };

  // 8) Delete Media
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: number) => {
        // CORRECTION : utilisation de /api/pros/ (pluriel) pour correspondre à la convention
        await api.delete(`/api/pros/media/${mediaId}/`);
    },
    onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["pro-me"] });
        toast.success("Fichier supprimé.");
    },
    onError: () => toast.error("Erreur suppression.")
  });

  // 9) Upload avatar
  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      // CORRECTION : utilisation de /api/pros/me/ (pluriel)
      const { data } = await api.patch("/api/pros/me/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      qc.setQueryData(["pro-me"], data);
      toast.success("Avatar mis à jour.");
    } catch {
      toast.error("Erreur upload avatar.");
    } finally {
      setIsUploading(false);
    }
  };

  // 10) Partage
  const handleShare = () => {
    if (!pro) return;

    // Texte conforme au CdC
    const shareText = `Vous êtes à la recherche d’un ${
      pro.metier_name || "professionnel"
    } ? Contactez ${pro.nom_entreprise} vite sur Senegal Contact !`;
    const shareUrl = `${window.location.origin}/pros/${pro.slug}`;

    if (navigator.share) {
      navigator
        .share({
          title: pro.nom_entreprise,
          text: shareText,
          url: shareUrl,
        })
        .catch(console.error);
    } else {
      // Fallback copier-coller
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast.success("Lien et texte copiés !");
    }
  };


  const onSubmit = (values: ProForm) => {
    updateMutation.mutate({
      ...values,
      metier: Number(values.metier),
      zone_geographique: Number(values.zone_geographique),
    });
  };

  if (!token) return null;
  if (proQ.isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-zinc-500" /></div>;
  if (proQ.isError) { router.replace("/pro/login"); return null; }

  const isVisible = !!pro?.est_publie;
  const avatarSrc = mediaUrl(pro?.avatar ?? null);
  const canPublish = isPremium && isWhatsAppVerified && pro?.metier && pro?.zone_geographique;

  // Filtrage des médias
  const cvList = pro?.medias?.filter((m: any) => m.type_media === 'CV') ?? [];
  const galleryList = pro?.medias?.filter((m: any) => m.type_media === 'PHOTO' || m.type_media === 'VIDEO') ?? [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">

      {/* HEADER : TITRE + ACTION PARTAGER + VISIBILITÉ */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Mon Profil Pro</h1>
          <p className="text-zinc-400 text-sm">Gérez vos informations, votre galerie et votre visibilité.</p>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
             {/* Bouton Partager */}
             <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 px-4 text-sm font-medium hover:bg-white/10 transition-colors"
             >
                <Share2 size={16} /> Partager mon profil
             </button>

             {/* Carte Visibilité */}
            <div className={`rounded-2xl border p-4 ${isVisible ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-zinc-900"}`}>
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${isVisible ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                    <span className={`font-semibold ${isVisible ? "text-emerald-400" : "text-zinc-400"}`}>
                    {isVisible ? "En ligne" : "Hors ligne"}
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
                {isVisible ? "Masquer" : "Publier"}
            </button>

            {/* Messages d'erreur préventifs */}
            {!isVisible && (
                <div className="mt-3 space-y-2 border-t border-white/5 pt-2">
                {!isPremium && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-1.5 rounded-lg">
                    <CreditCard size={12} /> Paiement 1000F requis
                    </div>
                )}
                {!isWhatsAppVerified && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-1.5 rounded-lg">
                    <Smartphone size={12} /> WhatsApp non vérifié
                    </div>
                )}
                {(!pro?.metier || !pro?.zone_geographique) && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-1.5 rounded-lg">
                    <AlertTriangle size={12} /> Infos incomplètes
                    </div>
                )}
                </div>
            )}
            </div>
        </div>
      </div>

      {/* FORMULAIRE PRINCIPAL */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white border-b border-white/5 pb-2">Informations</h2>

            {/* SELECTEUR METIER */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Métier *</label>
                <select
                {...register("metier", { required: true })}
                className="w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                >
                <option value="">Sélectionner...</option>
                {jobsQ.data?.map((j) => (
                    <option key={j.id} value={j.id}>{j.name}</option> // Correction: j.name (Catalog API)
                ))}
                </select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Nom commercial</label>
                <input
                {...register("nom_entreprise")}
                className="w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                placeholder="Ex: Ndiaye Couture"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Description</label>
                <textarea
                {...register("description")}
                className="w-full min-h-[100px] rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors resize-none"
                placeholder="Présentez votre activité..."
                />
            </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white border-b border-white/5 pb-2">Localisation & Contacts</h2>

            {/* SELECTEUR ZONE */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Ville / Quartier *</label>
                <select
                {...register("zone_geographique", { required: true })}
                className="w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                >
                <option value="">Sélectionner...</option>
                {locsQ.data?.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                ))}
                </select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Téléphone (Appel)</label>
                <input
                    {...register("telephone_appel")}
                    className="w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                    placeholder="77 000 00 00"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">WhatsApp</label>
                <input
                    {...register("telephone_whatsapp")}
                    className="w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                    placeholder="77 000 00 00"
                />
            </div>

            <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-zinc-400">Statut disponibilité</label>
                <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                        <input type="radio" value="ONLINE" {...register("statut_en_ligne")} className="peer hidden" />
                        <div className="rounded-xl border border-white/10 bg-black py-2 text-center text-sm peer-checked:bg-emerald-500/20 peer-checked:text-emerald-400 peer-checked:border-emerald-500/50 transition-all">
                            🟢 En ligne
                        </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                        <input type="radio" value="OFFLINE" {...register("statut_en_ligne")} className="peer hidden" />
                        <div className="rounded-xl border border-white/10 bg-black py-2 text-center text-sm peer-checked:bg-red-500/20 peer-checked:text-red-400 peer-checked:border-red-500/50 transition-all">
                            🔴 Hors service
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

      {/* GESTION MEDIAS (AVATAR / CV / GALERIE) */}
      <section className="space-y-6">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="text-indigo-400"/> Galerie & Documents
         </h2>

         <div className="grid md:grid-cols-2 gap-6">

            {/* 1. Avatar */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5 flex flex-col items-center justify-center gap-4">
                <div className="relative h-32 w-32 rounded-full overflow-hidden border-2 border-white/10 bg-black">
                    {avatarSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                            <ImageIcon size={32} />
                        </div>
                    )}
                </div>
                <label className={`flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 cursor-pointer ${isUploading ? 'opacity-50' : ''}`}>
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Changer photo de profil
                    <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                </label>
            </div>

            {/* 2. CV */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white flex items-center gap-2"><FileText size={16}/> Mon CV</h3>
                    <label className={`text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-indigo-500/30 ${isUploading ? 'opacity-50' : ''}`}>
                         {isUploading ? "Envoi..." : "+ Ajouter CV (PDF)"}
                         <input type="file" accept="application/pdf" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && handleUploadMedia(e.target.files[0], "CV")} />
                    </label>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                    {cvList.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-xl">Aucun CV ajouté</div>
                    ) : (
                        cvList.map((cv: any) => (
                            <div key={cv.id} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText size={18} className="text-red-400 shrink-0"/>
                                    <span className="text-xs truncate text-zinc-300">Document CV</span>
                                </div>
                                <div className="flex gap-2">
                                    <a href={mediaUrl(cv.fichier)} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400"><Eye size={14}/></a>
                                    <button onClick={() => deleteMediaMutation.mutate(cv.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

         </div>

         {/* 3. Galerie Photos/Vidéos */}
         <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
                 <h3 className="font-semibold text-white flex items-center gap-2"><ImageIcon size={16}/> Photos & Vidéos de réalisation</h3>
                 <div className="flex gap-2">
                     <label className={`text-xs bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 flex items-center gap-2 ${isUploading ? 'opacity-50' : ''}`}>
                         <Upload size={12}/> Photo
                         <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && handleUploadMedia(e.target.files[0], "PHOTO")} />
                     </label>
                     <label className={`text-xs bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 flex items-center gap-2 ${isUploading ? 'opacity-50' : ''}`}>
                         <Video size={12}/> Vidéo
                         <input type="file" accept="video/*" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && handleUploadMedia(e.target.files[0], "VIDEO")} />
                     </label>
                 </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {galleryList.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-sm text-zinc-500 border border-dashed border-white/10 rounded-xl">
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

                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a href={mediaUrl(m.fichier)} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"><Eye size={16}/></a>
                                <button onClick={() => deleteMediaMutation.mutate(m.id)} className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/40 text-red-400"><Trash2 size={16}/></button>
                            </div>

                            {/* Badge Type */}
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/50 text-white backdrop-blur-sm">
                                {m.type_media}
                            </div>
                        </div>
                    ))
                )}
            </div>
         </div>
      </section>

      {/* BANDEAU ABONNEMENT */}
      {!isPremium && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-600 to-amber-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-xl shadow-amber-900/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
               <CreditCard size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Activez votre compte Pro</h3>
              <p className="text-amber-100 text-sm">Pour être contacté par les clients, l'abonnement est de 1000 FCFA/mois.</p>
            </div>
          </div>
          <button onClick={() => router.push("/pro/premium")} className="whitespace-nowrap rounded-xl bg-white text-amber-700 px-6 py-3 font-bold hover:bg-amber-50 transition-colors">
             Payer 1000 FCFA
          </button>
        </div>
      )}
    </main>
  );
}