"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Phone, Lock, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/auth.store";
import { login } from "@/lib/auth.api";

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
  const [showPassword, setShowPassword] = useState(false); // Gestion visibilité mot de passe

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
      const data = await login({
        phone: values.phone,
        password: values.password
      });

      if (!data.access) throw new Error("Erreur protocole: Token manquant");

      setTokens(data.access, data.refresh);
      toast.success("Ravi de vous revoir !");
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Erreur Login:", error);
      if (error.response?.status === 401) {
        setGlobalError("Identifiants incorrects. Vérifiez votre numéro.");
      } else if (error.response?.status === 400) {
        setGlobalError("Données invalides.");
      } else {
        setGlobalError("Erreur de connexion. Vérifiez votre réseau.");
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-zinc-950">

      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 -z-10">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,0,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_40%)]" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00FF00]/5 blur-[100px] rounded-full" />
      </div>

      {/* --- BOUTON RETOUR --- */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium">
        <ArrowLeft size={16} />
        Retour à l'accueil
      </Link>

      <main className="w-full max-w-md relative z-10">

        {/* --- HEADER --- */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-zinc-900 border border-white/10 shadow-xl shadow-black/50 mb-6 group">
             {/* Logo stylisé ou icône */}
             <div className="h-8 w-8 rounded bg-gradient-to-tr from-[#00FF00] to-emerald-600 flex items-center justify-center text-black font-bold text-xl">S</div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Espace <span className="text-[#00FF00]">Pro</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Gérez votre visibilité et répondez à vos clients.
          </p>
        </div>

        {/* --- FORM CARD --- */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* ERROR ALERT */}
            {globalError && (
              <div className="flex items-start gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{globalError}</p>
              </div>
            )}

            {/* PHONE INPUT */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                Numéro de téléphone
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#00FF00] transition-colors">
                    <Phone size={18} />
                </div>
                <input
                  type="tel"
                  placeholder="77 000 00 00"
                  className="w-full rounded-xl bg-black/50 border border-white/10 pl-11 pr-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF00]/50 focus:ring-1 focus:ring-[#00FF00]/50 transition-all"
                  {...register("phone")}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-400 ml-1 mt-1">{errors.phone.message}</p>}
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Mot de passe</label>
                  <Link href="/pro/password-reset" className="text-xs text-[#00FF00] hover:underline underline-offset-4 opacity-80 hover:opacity-100 transition-opacity">
                    Mot de passe oublié ?
                  </Link>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#00FF00] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-black/50 border border-white/10 pl-11 pr-11 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF00]/50 focus:ring-1 focus:ring-[#00FF00]/50 transition-all"
                  {...register("password")}
                />

                {/* Toggle Password Visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-zinc-500 hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 ml-1 mt-1">{errors.password.message}</p>}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-xl bg-white py-3.5 font-bold text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:bg-zinc-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              <div className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Connexion...</span>
                    </>
                ) : (
                    <span>Accéder à mon compte</span>
                )}
              </div>
            </button>

          </form>
        </div>

        {/* --- FOOTER --- */}
        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Vous n'avez pas de compte ?{" "}
            <button
              type="button"
              onClick={() => router.push("/pro/register")}
              className="text-white hover:text-[#00FF00] font-semibold transition-colors underline-offset-4 hover:underline"
            >
              S'inscrire maintenant
            </button>
          </p>
        </div>

      </main>
    </div>
  );
}