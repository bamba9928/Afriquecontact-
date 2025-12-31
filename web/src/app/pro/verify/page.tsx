"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { verifyWhatsapp, resendOtp } from "@/lib/auth.api";
import { useAuthStore } from "@/lib/auth.store";
import { Loader2, MessageCircle, ArrowRight, ShieldCheck, Smartphone } from "lucide-react";

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
      // Stockage des tokens (JWT)
      setTokens(res.access, res.refresh);
      toast.success("Compte vérifié avec succès !");

      // Redirection vers le profil pour compléter les infos ou le dashboard
      router.push("/pro/profil");
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || "Code incorrect ou expiré.";
      toast.error(detail);
    },
  });

  // Mutation de renvoi
  const resendMut = useMutation({
    mutationFn: () => resendOtp({ phone }),
    onSuccess: () => toast.success("Nouveau code envoyé sur WhatsApp."),
    onError: (err: any) => toast.error("Impossible de renvoyer le code. Réessayez plus tard."),
  });

  const handleVerify = () => {
    if (code.length < 4) return toast.warning("Code trop court.");
    verifyMut.mutate();
  };

  return (
    <div className="w-full max-w-md space-y-6">

      {/* En-tête */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
          <MessageCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white">Vérification WhatsApp</h1>
        <p className="text-sm text-zinc-400">
          Nous avons envoyé un code au <br/>
          <span className="text-white font-mono font-medium text-base">{phone}</span>
        </p>
      </div>

      {/* Carte Formulaire */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 md:p-8 backdrop-blur-sm shadow-xl space-y-6">

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider ml-1">Code de confirmation</label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-3 h-5 w-5 text-emerald-500/50" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} // Chiffres uniquement
              maxLength={6}
              className="w-full rounded-xl bg-black border border-white/10 pl-10 pr-4 py-3 text-center text-lg font-bold tracking-[0.5em] text-white outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-700 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
              placeholder="123456"
            />
          </div>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifyMut.isPending || code.length < 4}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white py-3.5 font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifyMut.isPending ? <Loader2 className="animate-spin" /> : "Vérifier mon compte"}
          {!verifyMut.isPending && <ArrowRight size={18} />}
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-xs text-zinc-500">Code non reçu ?</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          onClick={() => resendMut.mutate()}
          disabled={resendMut.isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {resendMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
          Renvoyer le code par WhatsApp
        </button>

      </div>

      <p className="text-center text-xs text-zinc-500">
        Vous vous êtes trompé de numéro ? <br/>
        <button onClick={() => router.push("/pro/register")} className="text-emerald-400 hover:underline mt-1">
          Retour à l'inscription
        </button>
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="text-zinc-500 flex flex-col items-center gap-2"><Loader2 className="animate-spin"/> Chargement...</div>}>
        <VerifyContent />
      </Suspense>
    </main>
  );
}