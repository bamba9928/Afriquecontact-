"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { verifyWhatsapp, resendOtp } from "@/lib/auth.api";
import { useAuthStore } from "@/lib/auth.store";

export default function VerifyPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const phone = sp.get("phone") ?? "";

  const [code, setCode] = useState("");

  const setTokens = useAuthStore((s) => s.setTokens);

  const verifyMut = useMutation({
    mutationFn: () => verifyWhatsapp({ phone, code }),
    onSuccess: (res) => {
      setTokens(res.access, res.refresh);
      toast.success("WhatsApp vérifié. Connecté.");
      router.push("/pro/profil");
    },
    onError: (err: any) => {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : "Erreur vérification";
      toast.error(msg);
    },
  });

  const resendMut = useMutation({
    mutationFn: () => resendOtp({ phone }),
    onSuccess: () => toast.success("Code renvoyé."),
    onError: () => toast.error("Erreur renvoi."),
  });

  return (
    <main className="mx-auto max-w-md px-4 py-8 space-y-4">
      <h1 className="text-xl font-semibold">Vérification WhatsApp</h1>
      <div className="text-sm text-white/70">Téléphone : {phone}</div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-xl bg-black border border-white/10 px-3 py-2 outline-none"
          placeholder="Code OTP (DEBUG: 123456)"
        />

        <button
          onClick={() => verifyMut.mutate()}
          disabled={verifyMut.isPending}
          className="w-full rounded-xl bg-white text-black py-2 font-semibold disabled:opacity-60"
        >
          {verifyMut.isPending ? "Vérification..." : "Valider"}
        </button>

        <button
          onClick={() => resendMut.mutate()}
          disabled={resendMut.isPending}
          className="w-full rounded-xl border border-white/20 py-2 text-sm disabled:opacity-60"
        >
          {resendMut.isPending ? "Envoi..." : "Renvoyer le code"}
        </button>
      </div>
    </main>
  );
}
