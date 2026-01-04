"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { verifyWhatsapp, resendOtp } from "@/lib/auth.api";
import { useAuthStore } from "@/lib/auth.store";
import { Loader2, MessageCircle, ArrowRight, ShieldCheck, Smartphone, RefreshCw, ChevronLeft } from "lucide-react";
import { clsx } from "clsx";

function VerifyContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const phone = sp.get("phone") ?? "";

  const [code, setCode] = useState("");
  const setTokens = useAuthStore((s) => s.setTokens);

  // Sécurité : Si pas de téléphone, retour au login
  useEffect(() => {
    if (!phone) {
      toast.error("Numéro de téléphone manquant.");
      router.replace("/pro/register");
    }
  }, [phone, router]);

  // Mutation de vérification
  const verifyMut = useMutation({
    mutationFn: () => verifyWhatsapp({ phone, code }),
    onSuccess: (res) => {
      setTokens(res.access, res.refresh);
      toast.success("Identité confirmée !");
      router.push("/pro/profil"); // On redirige vers le profil pour compléter
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || "Code incorrect. Veuillez réessayer.";
      toast.error(detail);
      setCode(""); // Reset code on error for UX
    },
  });

  // Mutation de renvoi
  const resendMut = useMutation({
    mutationFn: () => resendOtp({ phone }),
    onSuccess: () => toast.success("Code renvoyé sur WhatsApp !"),
    onError: () => toast.error("Erreur d'envoi. Attendez quelques instants."),
  });

  const handleVerify = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length < 4) return toast.warning("Le code est incomplet.");
    verifyMut.mutate();
  };

  return (
    <div className="w-full max-w-md relative z-10">

      {/* Bouton Retour */}
      <button
        onClick={() => router.push("/pro/register")}
        className="absolute -top-16 left-0 text-zinc-500 hover:text-white flex items-center gap-2 text-sm transition-colors"
      >
        <ChevronLeft size={16} /> Modifier mon numéro
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500 mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <MessageCircle size={40} strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Vérifiez votre WhatsApp</h1>
        <p className="text-zinc-400 text-lg">
          Code envoyé au <span className="text-white font-mono font-bold">{phone}</span>
        </p>
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl">
        <form onSubmit={handleVerify} className="space-y-6">

          <div className="space-y-3">
            <label className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <span>Code de confirmation</span>
              <span className={clsx("transition-colors", code.length === 6 ? "text-emerald-500" : "text-zinc-600")}>
                {code.length}/6
              </span>
            </label>

            <div className="relative group">
              <ShieldCheck className={clsx(
                  "absolute left-4 top-4 h-6 w-6 transition-colors",
                  code.length === 6 ? "text-emerald-500" : "text-zinc-600 group-focus-within:text-emerald-500"
              )} />

              <input
                autoFocus
                value={code}
                onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setCode(val);
                    // Auto-submit si 6 chiffres
                    if (val.length === 6) verifyMut.mutate();
                }}
                maxLength={6}
                className="w-full rounded-2xl bg-black/50 border border-white/10 pl-12 pr-4 py-4 text-center text-2xl font-mono font-bold tracking-[0.5em] text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-800 placeholder:font-normal placeholder:text-sm placeholder:tracking-normal"
                placeholder="000000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={verifyMut.isPending || code.length < 4}
            className="w-full relative overflow-hidden rounded-xl bg-emerald-600 text-white py-4 font-bold text-lg hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
                {verifyMut.isPending ? (
                    <>
                        <Loader2 className="animate-spin" /> Vérification...
                    </>
                ) : (
                    <>
                        Valider
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </div>
          </button>

        </form>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-zinc-500 text-sm mb-4">Vous n'avez rien reçu ?</p>
            <button
                onClick={() => resendMut.mutate()}
                disabled={resendMut.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-medium transition-colors disabled:opacity-50"
            >
                {resendMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Renvoyer le code
            </button>
        </div>

      </div>

      {/* Security Badge */}
      <div className="mt-8 flex justify-center gap-2 text-xs text-zinc-600 font-medium">
         <ShieldCheck size={14} /> Connexion sécurisée de bout en bout
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-zinc-950 overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none" />

      <Suspense fallback={
        <div className="flex flex-col items-center gap-3 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-sm font-medium">Sécurisation de la connexion...</p>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </main>
  );
}