"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Lock, AlertCircle } from "lucide-react";

import { useAuthStore } from "@/lib/auth.store";


const Schema = z.object({
  phone: z.string().min(9, "Numéro trop court"),
  password: z.string().min(4, "Mot de passe requis"),
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
      // ✅ Appel via la fonction centralisée
      const data = await login({
        phone: values.phone,
        password: values.password
      });

      if (!data.access) throw new Error("Aucun token reçu");

      // Sauvegarde dans le store
      setTokens(data.access, data.refresh);

      router.push("/pro/dashboard");

    } catch (error: any) {
      console.error("Erreur Login:", error);
      if (error.response?.status === 401 || error.response?.status === 400) {
        setGlobalError("Numéro ou mot de passe incorrect.");
      } else {
        setGlobalError("Erreur de connexion.");
      }
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <main className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Connexion Pro</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Accédez à votre espace pour gérer vos annonces
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {globalError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
              <AlertCircle size={16} />
              {globalError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
              <input
                type="tel"
                className="w-full rounded-xl bg-white/5 border border-white/10 py-2 pl-10 pr-4 outline-none focus:border-white/30 transition-all"
                {...register("phone")}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
              <input
                type="password"
                className="w-full rounded-xl bg-white/5 border border-white/10 py-2 pl-10 pr-4 outline-none focus:border-white/30 transition-all"
                {...register("password")}
              />
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold text-black hover:bg-zinc-200 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>

          <div className="text-center text-sm">
            <span className="text-zinc-500">Pas encore de compte ? </span>
            <button type="button" onClick={() => router.push("/pro/register")} className="text-white hover:underline font-medium">
              Créer un compte
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}