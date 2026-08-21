import { describe, expect, it } from "vitest";
import { getGarageRouteContract } from "../client/src/lib/garageContracts";
import { buildCsv, canSuspendAfterSupportRead, getProfessionalRoute, markSupportThreadReviewed, openSupportThread, openSuspensionConfirmation } from "../client/src/lib/adminContracts";
import { canExecuteAdminAction, hasAdminAccess, requiresAdminConfirmation } from "../client/src/lib/adminSecurityContracts";
import { AdminAccessGate } from "../client/src/components/AdminAccessGate";
import { AdminNavigation } from "../client/src/components/DashboardLayout";
import { SidebarProvider } from "../client/src/components/ui/sidebar";
import { DataTable, EmptyDataTableState, getListEmptyLabel, invoiceStatusLabel, KpiCard, paymentProviderLabel, paymentStatusLabel } from "../client/src/pages/Home";
import { Users } from "lucide-react";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const layoutSource = readFileSync(resolve(process.cwd(), "client/src/components/DashboardLayout.tsx"), "utf8");
const routersSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

describe("WapiGarage dashboard contract", () => {
  it("translates payment providers and statuses into useful French labels", () => {
    expect(paymentProviderLabel("airtel")).toBe("Airtel Money");
    expect(paymentProviderLabel("mtn")).toBe("MTN Mobile Money");
    expect(paymentStatusLabel("success")).toBe("Payé");
    expect(paymentStatusLabel("pending")).toBe("En attente");
    expect(paymentStatusLabel("failed")).toBe("Échoué");
    expect(invoiceStatusLabel("paid")).toBe("Payée");
    expect(invoiceStatusLabel("expired")).toBe("Expirée");
  });

  it("keeps the required French navigation labels", () => {
    for (const label of ["Garages", "Utilisateurs", "Paiements", "Factures", "Avis et modération", "Notifications", "Sécurité et audit", "Paramètres"]) {
      expect(layoutSource).toContain(`label: \"${label}\"`);
    }
  });

  it("keeps invoice authors and real reports visible", () => {
    expect(routersSource).toContain("client_author");
    expect(routersSource).toContain('from("support_reports").select("*")');
    expect(homeSource).toContain("Auteur client");
    expect(homeSource).toContain("Garage pro");
    expect(homeSource).toContain("supportReportsQuery");
    expect(homeSource).toContain("Facture :");
    expect(routersSource).toContain("payer:");
    expect(homeSource).toContain("Pro émetteur");
    expect(homeSource).toContain("Client bénéficiaire");
    expect(homeSource).toContain("Numéro réellement payeur");
  });

  it("keeps finance management contracts real and transparent", () => {
    expect(homeSource).toContain("trpc.admin.finance.useQuery");
    expect(homeSource).toContain("trpc.admin.addFinanceEntry.useMutation");
    expect(homeSource).toContain("trpc.admin.updateFinanceSettings.useMutation");
    expect(homeSource).toContain("Non calculable");
    expect(routersSource).toContain('from("finance_settings")');
    expect(routersSource).toContain('from("finance_entries")');
  });

  it("keeps banner management server and UI contracts", () => {
    expect(homeSource).toContain('name: "Bannières"');
    expect(homeSource).toContain("trpc.admin.banners.useQuery");
    expect(homeSource).toContain("trpc.admin.uploadBanner.useMutation");
    expect(homeSource).toContain("trpc.admin.updateBannerStatus.useMutation");
    expect(homeSource).toContain("Aucune bannière réelle enregistrée.");
    expect(homeSource).toContain("5 Mo maximum");
  });

  it("provides page-specific help content for key admin pages", () => {
    expect(layoutSource).toContain("L’accueil rassemble les indicateurs Supabase");
    expect(layoutSource).toContain("Cette page permet de contrôler les transactions KPay");
    expect(layoutSource).toContain("Cette page affiche les abonnements, les garages payeurs");
    expect(layoutSource).toContain("Le bouton d’export produit uniquement les lignes Supabase chargées");
    expect(layoutSource).toContain("Règle générale");
    expect(layoutSource).toContain("currentGuide.points.map");
  });

  it("keeps the main admin detail routes and moderation sections", () => {
    expect(homeSource).toContain('type === "garage" ? "garages"');
    expect(homeSource).toContain('type === "user" ? "users"');
    expect(homeSource).toContain('type === "payment" ? "payments"');
    expect(homeSource).toContain('type === "invoice" ? "invoices"');
    expect(homeSource).toContain("Signalement");
    expect(homeSource).toContain("Masqués");
    expect(homeSource).toContain("Approuver");
    expect(homeSource).toContain("Restaurer");
  });

  it("covers real-data pages, exports, confirmations and support/user flows", () => {
    expect(homeSource).toContain('const payments: Row[]');
    expect(homeSource).toContain('function downloadCsv');
    expect(homeSource).toContain('type: "text/csv;charset=utf-8"');
    expect(homeSource).toContain('function ConfirmActionDialog');
    expect(homeSource).toContain('function SupportPage');
    expect(homeSource).toContain('Suspendre après lecture');
    expect(homeSource).toContain('function UserDetailPage');
    expect(homeSource).toContain('Compte professionnel');
    expect(homeSource).toContain('Signalement');
  });

  it("executes the export, support and professional-account contracts", () => {
    const csv = buildCsv([{ id: "PAY-TEST", name: "PAY-TEST", meta: "Garage Central", status: "Confirmé", amount: "50 000 FCFA", extra: "Aujourd’hui" }]);
    expect(csv).toContain('"id","nom","details","statut","montant_serveur","activite"');
    expect(csv).toContain("PAY-TEST");
    expect(csv).toContain("\n");
    expect(getProfessionalRoute("garage-central")).toBe("/garages/garage-central");
    expect(getProfessionalRoute()).toBeNull();
    let workflow = { selectedThreadId: null as string | null, reviewedThreadId: null as string | null, confirmationOpen: false };
    workflow = openSupportThread(workflow, "support-001");
    expect(canSuspendAfterSupportRead(workflow)).toBe(false);
    workflow = markSupportThreadReviewed(workflow, "support-001");
    expect(canSuspendAfterSupportRead(workflow)).toBe(true);
    expect(openSuspensionConfirmation(workflow).confirmationOpen).toBe(true);
  });

  it("covers certification, subscription and security administration flows", () => {
    expect(homeSource).toContain("function CertificationPage");
    expect(homeSource).toContain("Demandes de certification");
    expect(homeSource).toContain("Voir les données");
    expect(homeSource).toContain("Confirmer la certification");
    expect(homeSource).toContain("function SubscriptionsPage");
    expect(homeSource).toContain("Gestion des abonnements");
    expect(homeSource).toContain("trpc.admin.subscriptions.useQuery");
    expect(homeSource).toContain("trpc.admin.updateSubscriptionStatus.useMutation");
    expect(homeSource).toContain("Confirmer le changement d’abonnement");
    expect(homeSource).toContain("Aucun abonnement réel disponible");
    expect(homeSource).toContain("function SecurityPage");
    expect(homeSource).toContain("trpc.admin.auditLogs.useQuery");
    expect(homeSource).toContain("Aucune action d’audit réelle disponible");
    expect(homeSource).toContain('location === "/certifications"');
    expect(homeSource).toContain('location === "/subscriptions"');
    expect(homeSource).toContain('location === "/security"');
  });

  it("executes the admin access and sensitive-action security contracts", () => {
    expect(hasAdminAccess(null)).toBe(false);
    expect(hasAdminAccess(null, true)).toBe(true);
    expect(hasAdminAccess({ role: "admin" })).toBe(true);
    expect(hasAdminAccess({ role: "user" })).toBe(false);
    expect(requiresAdminConfirmation("subscription_suspend")).toBe(true);
    expect(requiresAdminConfirmation("session_revoke")).toBe(true);
    expect(canExecuteAdminAction("certification_approve", false)).toBe(false);
    expect(canExecuteAdminAction("certification_approve", true)).toBe(true);
    expect(canExecuteAdminAction("subscription_delete", true)).toBe(true);
  });

  it("keeps support, payment and invoice data contracts connected to real sources", () => {
    expect(layoutSource).toContain('label: "Signalements et support"');
    expect(homeSource).toContain("trpc.admin.supportReports.useQuery");
    expect(homeSource).toContain("Aucun signalement ou message support réel disponible");
    expect(homeSource).toContain("Airtel Money");
    expect(homeSource).toContain("invoiceStatusLabel");
    expect(homeSource).toContain("return Array.from(new Set([defaultOption, ...fixedOptions, ...liveOptions]))");
    expect(routersSource).toContain("kpay_payments");
    expect(routersSource).toContain('external_id,garage_id,client_id');
    expect(routersSource).toContain('source: \"payment_link\"');
  });

  it("exposes the server-side admin guard for sensitive actions", () => {
    const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(routerSource).toContain("adminProcedure");
    expect(routerSource).toContain("authorizeSensitiveAction");
    expect(routerSource).toContain("subscription_delete");
    expect(routerSource).toContain("updateSubscriptionStatus");
    expect(routerSource).toContain('z.enum(["active", "trialing", "past_due", "expired", "cancelled"])');
    expect(routerSource).toContain("subscription_status_");
  });

  it("renders a real blocked screen for visitor and non-admin roles", () => {
    const visitor = renderToStaticMarkup(AdminAccessGate({ user: null, children: "secret-admin-content" }));
    const member = renderToStaticMarkup(AdminAccessGate({ user: { role: "user" }, children: "secret-admin-content" }));
    const admin = renderToStaticMarkup(AdminAccessGate({ user: { role: "admin" }, children: "secret-admin-content" }));
    expect(visitor).toContain("Accès administrateur requis");
    expect(visitor).not.toContain("secret-admin-content");
    expect(member).toContain("Accès administrateur requis");
    expect(admin).toContain("secret-admin-content");
  });

  it("keeps the official WapiGarage palette in the layout", () => {
    expect(layoutSource).toContain("#1D7159");
    expect(layoutSource).toContain("#F2F3F5");
    expect(layoutSource).toContain("const adminAccess = hasAdminAccess(user as { role?: string } | null);");
    expect(layoutSource).not.toContain("hasAdminAccess(user as { role?: string } | null, import.meta.env.DEV)");
  });

  it("returns the exact rendered contract for every garage detail route", () => {
    const expected = [
      ["garage-central", "Garage Central", "Brazzaville · Moungali", "Koffi", "N'Guessan", "koffi.ng@example.com"],
      ["garage-ivoire", "Ivoire Auto Service", "Pointe-Noire · Loandjili", "Jean", "Bamba", "+242 06 987 65 43"],
      ["garage-modern", "Modern Motors", "Dolisie · Centre-ville", "Patrick", "Mabiala", "patrick.mabiala@example.com"],
      ["garage-express", "Express Mécanique", "Brazzaville · Talangaï", "Clarisse", "Mvoula", "+242 05 441 22 10"],
      ["garage-elite", "Elite Car Care", "Pointe-Noire · Tié-Tié", "Armand", "Ngoma", "armand.ngoma@example.com"],
    ];

    for (const [id, name, location, ownerFirstName, ownerLastName, contact] of expected) {
      expect(getGarageRouteContract(id)).toEqual({ id, name, location, ownerFirstName, ownerLastName, contact });
    }
  });

  it("renders explicit empty states for every primary list type", () => {
    const expected = [["garage", "les garages"], ["user", "les utilisateurs"], ["payment", "les paiements"], ["invoice", "les factures"]] as const;
    for (const [type, label] of expected) {
      expect(getListEmptyLabel(type)).toBe(label);
      const markup = renderToStaticMarkup(EmptyDataTableState({ label: getListEmptyLabel(type) }));
      expect(markup).toContain("Aucune donnée réelle disponible");
      expect(markup).toContain(label);
    }
  });

  it("renders the actual empty DataTable for every primary type", () => {
    const previousLocation = (globalThis as { location?: unknown }).location;
    Object.defineProperty(globalThis, "location", { configurable: true, value: { pathname: "/" } });
    try {
      for (const type of ["garage", "user", "payment", "invoice"] as const) {
        const markup = renderToStaticMarkup(React.createElement(DataTable, { rows: [], type }));
        expect(markup).toContain("Aucune donnée réelle disponible");
        expect(markup).toContain(getListEmptyLabel(type));
      }
    } finally {
      if (previousLocation === undefined) delete (globalThis as { location?: unknown }).location;
      else Object.defineProperty(globalThis, "location", { configurable: true, value: previousLocation });
    }
  });

  it("renders a KPI and the real navigation without simulated adornments", () => {
    const kpiMarkup = renderToStaticMarkup(React.createElement(KpiCard, { label: "Réussite KPay", value: "—", change: "Aucune donnée réelle", icon: Users }));
    expect(kpiMarkup).not.toContain("vs mois dernier");
    expect(kpiMarkup).toContain("Aucune donnée réelle");
    const navigationMarkup = renderToStaticMarkup(React.createElement(SidebarProvider, null, React.createElement(AdminNavigation, { location: "/", onNavigate: () => undefined })));
    expect(navigationMarkup).toContain("Garages");
    expect(navigationMarkup).not.toContain("Démo");
    expect(navigationMarkup).not.toMatch(/>\s*[1-9][0-9]*\s*</);
    expect(layoutSource).not.toMatch(/badge:\s*[1-9]/);
  });

  it("does not reintroduce catalogue data into the frontend", () => {
    expect(homeSource).toContain("const garages: Row[] = []");
    expect(homeSource).toContain("const users: Row[] = []");
    expect(homeSource).toContain("const payments: Row[] = []");
    expect(homeSource).toContain("const invoices: Row[] = []");
    expect(homeSource).toContain("Aucune donnée réelle disponible");
    expect(homeSource).not.toContain("Garage Central");
    expect(homeSource).not.toContain("PAY-92481");
    expect(homeSource).not.toContain("INV-8F2A-91D0");
    expect(homeSource).not.toContain("Données simulées");
  });
});
