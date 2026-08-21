import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { hasAdminAccess } from "@/lib/adminSecurityContracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    if (!loading && hasAdminAccess(user)) setLocation("/");
  }, [loading, setLocation, user]);

  async function handleSetup() {
    setError("");
    setIsSettingUp(true);
    try {
      const response = await fetch("/api/auth/admin/totp/setup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      const body = (await response.json().catch(() => null)) as { qrDataUrl?: string; error?: string } | null;
      if (!response.ok || !body?.qrDataUrl) throw new Error(body?.error || "Impossible de générer le QR code.");
      setQrDataUrl(body.qrDataUrl);
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "Impossible de générer le QR code.");
    } finally {
      setIsSettingUp(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, totp }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Connexion impossible.");
      }
      setLocation("/");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Connexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F2F3F5] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-[#dfe9e4] bg-white p-8 shadow-[0_18px_60px_rgba(29,113,89,0.12)]">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D7159] text-xl font-bold text-white">W</div>
          <div>
            <p className="text-lg font-bold text-[#163c31]">WapiGarage</p>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b9188]">Administration</p>
          </div>
        </div>
        <div className="mb-7">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f3ee] text-[#1D7159]"><ShieldCheck className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-[#163c31]">Connexion administrateur</h1>
          <p className="mt-2 text-sm leading-6 text-[#71847b]">Accédez au tableau de bord sécurisé de WapiGarage.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-[#29463b]">
            Adresse e-mail
            <div className="relative mt-2"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8ba097]" /><Input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl border-[#dce8e2] pl-10" placeholder="admin@wapigarage.com" /></div>
          </label>
          <label className="block text-sm font-semibold text-[#29463b]">
            Mot de passe
            <div className="relative mt-2"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8ba097]" /><Input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl border-[#dce8e2] pl-10" placeholder="Votre mot de passe" /></div>
          </label>
          <div className="rounded-xl bg-[#f7faf8] p-4"><p className="text-sm font-semibold text-[#29463b]">Authenticator</p><p className="mt-1 text-xs leading-5 text-[#71847b]">Scanne d’abord le QR code avec ton application, puis saisis le code à 6 chiffres.</p><Button type="button" variant="outline" onClick={handleSetup} disabled={isSettingUp || !email || !password} className="mt-3 h-9 rounded-lg border-[#cfe2d8] text-[#1D7159]">{isSettingUp ? "Génération…" : "Afficher le QR code"}</Button>{qrDataUrl ? <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-white p-3"><img src={qrDataUrl} alt="QR code de configuration Authenticator" className="h-48 w-48 rounded-lg" /><p className="text-center text-xs text-[#71847b]">Scanne ce QR code, puis utilise le code affiché par Authenticator.</p></div> : null}<Input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={totp} onChange={(event) => setTotp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-3 h-11 rounded-xl border-[#dce8e2]" placeholder="Code à 6 chiffres" /></div>
          {error ? <p role="alert" className="rounded-xl bg-[#fff0ee] px-3 py-2 text-sm text-[#a9362d]">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting || totp.length !== 6} className="h-11 w-full rounded-xl bg-[#1D7159] font-semibold text-white hover:bg-[#165b47]">{isSubmitting ? "Connexion en cours…" : "Se connecter"}</Button>
        </form>
        <p className="mt-6 text-center text-xs leading-5 text-[#8a9d94]">L’accès est limité aux administrateurs autorisés.</p>
      </section>
    </main>
  );
}
