"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Lock, AlertCircle, LogIn } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/auth.store";
import { login } from "@/lib/auth.api"; // Importation de la fonction API

// Schéma de validation
const Schema = z.object({
  phone: z.string().min(9, "Numéro de téléphone invalide"),
  password: z.string().min(4, "Le mot de passe est requis"),
});

type FormValues = z.infer<typeof Schema>;

export default function LoginPage() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
  });

  const onSubmit = async (values: FormValues) => {
    setGlobalError(null);
    try {
      // Appel API
      const data = await login({
        phone: values.phone,
        password: values.password
      });

      if (!data.access) throw new Error("Erreur protocole: Token manquant");

      // Sauvegarde des tokens
      setTokens(data.access, data.refresh);

      toast.success("Connexion réussie !");
      router.push("/dashboard"); // Redirection vers le tableau de bord

    } catch (error: any) {
      console.error("Erreur Login:", error);

      // Gestion fine des erreurs
      if (error.response?.status === 401) {
        setGlobalError("Numéro de téléphone ou mot de passe incorrect.");
      } else if (error.response?.status === 400) {
        setGlobalError("Données invalides.");
      } else {
        setGlobalError("Impossible de se connecter. Vérifiez votre réseau.");
      }
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <main className="w-full max-w-md space-y-6">

        {/* En-tête */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white mb-4">
            <LogIn size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Espace Pro</h1>
          <p className="text-sm text-zinc-400">
            Connectez-vous pour gérer votre activité et vos annonces.
          </p>
        </div>

        {/* Formulaire Carte */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 md:p-8 backdrop-blur-sm shadow-xl"
        >
          {globalError && (
            <div className="flex items-start gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{globalError}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider ml-1">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
              <input
                type="tel"
                placeholder="77 000 00 00"
                className="w-full rounded-xl bg-black border border-white/10 pl-10 pr-4 py-3 text-white outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                {...register("phone")}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-400 ml-1">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Mot de passe</label>
                {/* Lien mot de passe oublié (optionnel pour l'instant) */}
                <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300">Oublié ?</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
              <input
                type="password"
                placeholder="••••••"
                className="w-full rounded-xl bg-black border border-white/10 pl-10 pr-4 py-3 text-white outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                {...register("password")}
              />
            </div>
            {errors.password && <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center items-center gap-2 rounded-xl bg-white px-4 py-3.5 font-bold text-black hover:bg-zinc-200 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-lg shadow-white/5 mt-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Connexion..." : "Accéder à mon compte"}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-zinc-500">Pas encore partenaire ? </span>
          <button
            type="button"
            onClick={() => router.push("/pro/register")}
            className="text-white hover:text-indigo-400 font-semibold transition-colors"
          >
            Créer un compte Pro
          </button>
        </div>
      </main>
    </div>
  );
}