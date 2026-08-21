import React from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasAdminAccess } from "@/lib/adminSecurityContracts";

export function AdminAccessGate({ user, children, onLogout }: { user: { role?: string } | null | undefined; children: React.ReactNode; onLogout?: () => void }) {
  if (hasAdminAccess(user)) return <>{children}</>;
  return <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center"><div className="w-full rounded-2xl border border-[#e7d5d2] bg-white p-8 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-[#b33a30]" /><h1 className="mt-4 text-xl font-bold text-[#29463b]">Accès administrateur requis</h1><p className="mt-2 text-sm leading-6 text-[#81928a]">Votre compte ne possède pas le rôle administrateur. Les pages et actions du back-office sont bloquées.</p>{onLogout ? <Button className="mt-5 rounded-xl bg-[#1D7159] text-white" onClick={onLogout}>Se déconnecter</Button> : null}</div></div>;
}
