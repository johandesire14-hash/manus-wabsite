import React, { useEffect, useMemo, useState } from "react";
import { garageRouteContracts } from "@/lib/garageContracts";
import {
  buildCsv,
  canSuspendAfterSupportRead,
  getProfessionalRoute,
  markSupportThreadReviewed,
  openSupportThread,
  openSuspensionConfirmation,
  type SupportWorkflowState,
} from "@/lib/adminContracts";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { BANNER_STATUSES, bannerStatusLabel, type BannerStatus } from "@/lib/bannerContracts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Filter,
  Headphones,
  Image as ImageIcon,
  LockKeyhole,
  MoreHorizontal,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Settings,
  Star,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const green = "#1D7159";
const gold = "#E4B93A";

export function paymentProviderLabel(provider: unknown) {
  const value = String(provider ?? "").trim().toLowerCase();
  if (value.includes("airtel")) return "Airtel Money";
  if (value.includes("mtn")) return "MTN Mobile Money";
  if (value.includes("kpay")) return "KPay";
  return value ? String(provider) : "Fournisseur non renseigné";
}

export function paymentStatusLabel(status: unknown) {
  const value = String(status ?? "").trim().toLowerCase();
  if (["paid", "success", "succeeded", "completed", "confirmed"].includes(value)) return "Payé";
  if (["pending", "processing", "created", "initiated"].includes(value)) return "En attente";
  if (["failed", "failure", "error"].includes(value)) return "Échoué";
  if (["cancelled", "canceled"].includes(value)) return "Annulé";
  if (["expired", "timeout"].includes(value)) return "Expiré";
  return "Statut à vérifier";
}

export function invoiceStatusLabel(status: unknown) {
  const value = String(status ?? "").trim().toLowerCase();
  if (value === "issued") return "Émise";
  if (value === "pending") return "En attente de paiement";
  if (value === "paid") return "Payée";
  if (value === "failed") return "Échec du paiement";
  if (value === "expired") return "Expirée";
  if (value === "cancelled" || value === "canceled") return "Annulée";
  return "Statut à vérifier";
}

const garageOwners: Record<
  string,
  { firstName: string; lastName: string; email?: string; phone?: string }
> = {};

const garageDetails: Record<
  string,
  {
    overview: string[];
    photos: string[];
    reviews: string[];
    invoices: string[];
  }
> = {};

type SubscriptionStatus = "active" | "trialing" | "past_due" | "expired" | "cancelled";

type Row = {
  id: string;
  name: string;
  meta: string;
  status: string;
  statusTone: "green" | "gold" | "red" | "gray";
  amount?: string;
  extra?: string;
  icon?: React.ElementType;
};

const garages: Row[] = [];
const users: Row[] = [];
const payments: Row[] = [];
const invoices: Row[] = [];
const reviews: Row[] = [];
const userProfiles: Record<
  string,
  {
    email?: string;
    phone?: string;
    role: string;
    reviews: string[];
    professionalGarageId?: string;
  }
> = {};

const supportThreads: Array<{
  id: string;
  subject: string;
  sender: string;
  target: string;
  priority: string;
  status: string;
  content: string;
}> = [];

function downloadCsv(filename: string, rows: Row[]) {
  const csv = buildCsv(rows);
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  toast.success(`Export téléchargé · ${filename}`);
}

function StatusBadge({
  tone,
  children,
}: {
  tone: Row["statusTone"];
  children: React.ReactNode;
}) {
  const styles = {
    green: "bg-[#e5f1ec] text-[#1D7159]",
    gold: "bg-[#fff4d2] text-[#8a6200]",
    red: "bg-[#fde9e7] text-[#b33a30]",
    gray: "bg-[#eef1f0] text-[#687b73]",
  };
  return (
    <Badge
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[tone]}`}
    >
      {children}
    </Badge>
  );
}

function ExportButton({
  label = "Exporter",
  filename,
  rows,
}: {
  label?: string;
  filename: string;
  rows: Row[];
}) {
  return (
    <Button
      variant="outline"
      onClick={() => downloadCsv(filename, rows)}
      className="h-10 rounded-xl border-[#dce8e2] text-[#1D7159]"
    >
      <Download className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
}

function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = true,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              destructive
                ? "bg-[#b33a30] text-white hover:bg-[#922d25]"
                : "bg-[#1D7159] text-white hover:bg-[#165b47]"
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MessagePreviewDialog({
  thread,
  open,
  onClose,
  onSuspend,
}: {
  thread: (typeof supportThreads)[number] | null;
  open: boolean;
  onClose: () => void;
  onSuspend?: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{thread?.subject ?? "Message support"}</DialogTitle>
          <DialogDescription>
            {thread
              ? `${thread.sender} · ${thread.target} · Priorité ${thread.priority}`
              : "Contenu de la conversation"}
          </DialogDescription>
        </DialogHeader>
        {thread ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#f7faf8] p-4 text-sm leading-6 text-[#486057]">
              {thread.content}
            </div>
            <div className="flex items-center justify-between text-xs text-[#83958c]">
              <span>Statut · {thread.status}</span>
              <span>Référence · {thread.id}</span>
            </div>
            {onSuspend ? (
              <Button
                className="w-full rounded-xl bg-[#b33a30] text-white hover:bg-[#922d25]"
                onClick={onSuspend}
              >
                Suspendre après lecture
              </Button>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#1D7159]">
          {eyebrow ?? "WapiGarage Admin"}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[#183b30] md:text-[30px]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71847c]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function FilterBar({
  placeholder = "Rechercher...",
  onChange,
  status,
  onStatusChange,
  statusOptions = [
    "Tous les statuts",
    "Publié",
    "À valider",
    "En attente",
    "Confirmé",
    "Échoué",
    "Suspendu",
  ],
  secondary,
  onSecondaryChange,
  secondaryOptions = [],
  secondaryLabel = "Filtrer",
}: {
  placeholder?: string;
  onChange?: (value: string) => void;
  status?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: string[];
  secondary?: string;
  onSecondaryChange?: (value: string) => void;
  secondaryOptions?: string[];
  secondaryLabel?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#e4ebe7] bg-white p-3 shadow-[0_4px_20px_rgba(34,70,55,0.03)] sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aaba4]" />
        <Input
          onChange={event => onChange?.(event.target.value)}
          placeholder={placeholder}
          className="h-10 rounded-xl border-[#e6ede9] bg-[#f8faf9] pl-9 text-sm focus-visible:ring-[#1D7159]"
        />
      </div>
      <Button
        variant="outline"
        className="h-10 rounded-xl border-[#e2ebe6] text-[#61766d]"
      >
        <Filter className="mr-2 h-4 w-4" /> Filtres
      </Button>
      {secondaryOptions.length > 0 ? (
        <label className="flex h-10 items-center rounded-xl border border-[#e2ebe6] px-3 text-sm text-[#61766d]">
          <select
            aria-label={secondaryLabel}
            value={secondary ?? secondaryOptions[0]}
            onChange={event => onSecondaryChange?.(event.target.value)}
            className="bg-transparent outline-none"
          >
            {secondaryOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="flex h-10 items-center rounded-xl border border-[#e2ebe6] px-3 text-sm text-[#61766d]">
        <ChevronDown className="mr-2 h-4 w-4" />
        <select
          aria-label="Filtrer par statut"
          value={status ?? "Tous les statuts"}
          onChange={event => onStatusChange?.(event.target.value)}
          className="bg-transparent outline-none"
        >
          <option value="Tous les statuts">Tous les statuts</option>
          {statusOptions
            .filter(option => option !== "Tous les statuts")
            .map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}

export type ListType = "garage" | "user" | "payment" | "invoice" | "review";

export function getListEmptyLabel(type: ListType) {
  return type === "garage"
    ? "les garages"
    : type === "user"
      ? "les utilisateurs"
      : type === "payment"
        ? "les paiements"
        : type === "invoice"
          ? "les factures"
          : "les avis";
}

export function EmptyDataTableState({
  label = "cette liste",
}: {
  label?: string;
}) {
  return (
    <tr>
      <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#81928a]">
        Aucune donnée réelle disponible pour {label}.
      </td>
    </tr>
  );
}

export function DataTable({
  rows,
  type,
  live = false,
}: {
  rows: Row[];
  type: ListType;
  live?: boolean;
}) {
  const [, setLocation] = useLocation();
  const [pendingAction, setPendingAction] = useState<{
    row: Row;
    action: "suspend" | "delete";
  } | null>(null);
  const confirmAction = () => {
    if (!pendingAction) return;
    toast.success(
      pendingAction.action === "suspend"
        ? `${pendingAction.row.name} a été suspendu après confirmation`
        : `${pendingAction.row.name} a été supprimé après confirmation`
    );
    setPendingAction(null);
  };
  const openRow = (row: Row) =>
    setLocation(
      `/${type === "garage" ? "garages" : type === "user" ? "users" : type === "payment" ? "payments" : type === "invoice" ? "invoices" : "reviews"}/${row.id}`
    );
  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_4px_20px_rgba(34,70,55,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-[#edf1ef] bg-[#fbfcfb]">
              <tr className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a9d94]">
                <th className="px-5 py-4">
                  {type === "payment"
                    ? "Transaction"
                    : type === "invoice"
                      ? "Facture"
                      : type === "review"
                        ? "Avis"
                        : type === "garage"
                          ? "Garage"
                          : "Utilisateur"}
                </th>
                <th className="px-5 py-4">Détails</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4">
                  {type === "payment" || type === "invoice"
                    ? "Montant serveur"
                    : "Activité"}
                </th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f3f1]">
              {rows.length === 0 ? (
                <EmptyDataTableState label={getListEmptyLabel(type)} />
              ) : (
                rows.map(row => {
                  const Icon = row.icon ?? Building2;
                  return (
                    <tr
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer transition hover:bg-[#fbfdfc] focus:bg-[#f4faf7] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#1D7159]"
                      onClick={() => openRow(row)}
                      onKeyDown={event => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openRow(row);
                        }
                      }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3ef] text-[#1D7159]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#29463b]">
                              {row.name}
                            </p>
                            <p className="mt-0.5 text-xs text-[#97a69f]">
                              {row.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#667a71]">
                        {row.meta}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={row.statusTone}>
                          {row.status}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#29463b]">
                        {row.amount ?? row.extra}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {type === "garage" &&
                          row.status !== "Publié" &&
                          row.status !== "Suspendu" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-lg px-2 text-[11px] font-semibold text-[#1D7159]"
                              onClick={event => {
                                event.stopPropagation();
                                toast.success(
                                  `${row.name} est maintenant publié`
                                );
                              }}
                            >
                              Valider
                            </Button>
                          ) : null}
                          {(type === "user" || type === "garage") &&
                          row.status !== "Suspendu" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-lg px-2 text-[11px] font-semibold text-[#b33a30]"
                              onClick={event => {
                                event.stopPropagation();
                                setPendingAction({ row, action: "suspend" });
                              }}
                            >
                              Suspendre
                            </Button>
                          ) : null}
                          {type === "user" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-lg px-2 text-[11px] font-semibold text-[#b33a30]"
                              onClick={event => {
                                event.stopPropagation();
                                setPendingAction({ row, action: "delete" });
                              }}
                            >
                              Supprimer
                            </Button>
                          ) : null}
                          {type === "invoice" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-lg px-2 text-[11px] font-semibold text-[#1D7159]"
                              onClick={event => {
                                event.stopPropagation();
                                toast.success(
                                  `Paiement lié à ${row.id} ouvert`
                                );
                              }}
                            >
                              Paiement
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#91a39a]"
                            aria-label={`Ouvrir ${row.name}`}
                            onClick={event => {
                              event.stopPropagation();
                              openRow(row);
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#edf1ef] px-5 py-3 text-xs text-[#8a9d94]">
          <span>Affichage de {rows.length} éléments réels</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#1D7159]"
            onClick={() => toast.info("Aucune autre donnée réelle disponible")}
          >
            Voir tout <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
      <ConfirmActionDialog
        open={pendingAction !== null}
        title={
          pendingAction?.action === "delete"
            ? "Confirmer la suppression"
            : "Confirmer la suspension"
        }
        description={
          pendingAction
            ? `${pendingAction.action === "delete" ? "La suppression" : "La suspension"} de ${pendingAction.row.name} est une action sensible. Vérifiez la fiche et le support associé avant de continuer.`
            : ""
        }
        confirmLabel={
          pendingAction?.action === "delete"
            ? "Supprimer définitivement"
            : "Suspendre le compte"
        }
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmAction}
      />
    </>
  );
}

export function KpiCard({
  label,
  value,
  change,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  tone?: "green" | "gold" | "red";
}) {
  const toneStyles = {
    green: "bg-[#e8f3ee] text-[#1D7159]",
    gold: "bg-[#fff5d8] text-[#9a6d00]",
    red: "bg-[#fdebea] text-[#b33b31]",
  };
  return (
    <div className="rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_4px_20px_rgba(34,70,55,0.03)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#80928a]">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-[#1e3b31]">
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneStyles[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#1D7159]">
        <ArrowUpRight className="h-3.5 w-3.5" />
        {change}
      </div>
    </div>
  );
}

function HomeDashboard() {
  const [, setLocation] = useLocation();
  const overviewQuery = trpc.admin.overview.useQuery();
  const paymentsQuery = trpc.admin.payments.useQuery();
  const garagesQuery = trpc.admin.garages.useQuery();
  const overview = overviewQuery.data;
  const paymentRows = paymentsQuery.data ?? [];
  const formatFcfa = (amount: number) =>
    `${amount.toLocaleString("fr-FR")} FCFA`;
  const statusCounts = paymentRows.reduce<Record<string, number>>(
    (acc, payment) => {
      const status = String(payment.status ?? "unknown");
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const totalPaymentCount = paymentRows.length;
  const confirmedCount =
    statusCounts.paid ?? statusCounts.success ?? statusCounts.confirmed ?? 0;
  const successRate = totalPaymentCount
    ? `${Math.round((confirmedCount / totalPaymentCount) * 100)} %`
    : "—";
  const hasPaymentData = paymentRows.length > 0;
  const confirmedRevenue = paymentRows
    .filter(payment => ["paid", "success", "confirmed", "completed"].includes(String(payment.status).toLowerCase()))
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const pendingRevenue = paymentRows
    .filter(payment => String(payment.status).toLowerCase() === "pending")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const cityCounts = (garagesQuery.data ?? []).reduce<Record<string, number>>(
    (acc, garage) => {
      const source =
        `${garage.neighborhood ?? ""} ${garage.address ?? ""}`.toLowerCase();
      const city = source.includes("pointe")
        ? "Pointe-Noire"
        : source.includes("dolisie")
          ? "Dolisie"
          : source.includes("brazzaville")
            ? "Brazzaville"
            : "Non renseignée";
      acc[city] = (acc[city] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const cities = ["Brazzaville", "Pointe-Noire", "Dolisie"];
  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Vue d'ensemble"
        title="Bonjour, équipe WapiGarage"
        description="Les indicateurs ci-dessous proviennent uniquement des données Supabase."
        action={
          <ExportButton
            filename="wapigarage-rapport.csv"
            rows={[]}
            label="Exporter le rapport"
          />
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard
          label="Utilisateurs"
          value={overview ? overview.users.toLocaleString("fr-FR") : "—"}
          change={overview ? "Données Supabase" : "Aucune donnée réelle"}
          icon={Users}
        />
        <KpiCard
          label="Garages"
          value={overview ? overview.garages.toLocaleString("fr-FR") : "—"}
          change={overview ? "Données Supabase" : "Aucune donnée réelle"}
          icon={Building2}
        />
        <KpiCard
          label="Paiements"
          value={overview ? formatFcfa(overview.paymentTotal) : "—"}
          change={
            overview
              ? `${overview.paymentCount} transactions réelles`
              : "Aucune donnée réelle"
          }
          icon={WalletCards}
        />
        <KpiCard
          label="Factures en attente"
          value={
            overview ? overview.pendingInvoices.toLocaleString("fr-FR") : "—"
          }
          change={overview ? "Données Supabase" : "Aucune donnée réelle"}
          icon={FileText}
          tone="gold"
        />
        <KpiCard
          label="Avis"
          value={overview ? overview.reviews.toLocaleString("fr-FR") : "—"}
          change={overview ? "Données Supabase" : "Aucune donnée réelle"}
          icon={Star}
          tone="gold"
        />
        <KpiCard
          label="Réussite KPay"
          value={successRate}
          change={
            hasPaymentData
              ? "Calculé sur les paiements chargés"
              : "Aucune donnée réelle"
          }
          icon={CircleAlert}
          tone="red"
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-[#e4ebe7] bg-white p-5">
          <h2 className="font-semibold text-[#29463b]">Historique des transactions</h2>
          <p className="mt-1 text-xs text-[#8a9d94]">Les dernières transactions proviennent de kpay_payments.</p>
          {paymentRows.length ? (
            <div className="mt-5 space-y-2">
              {paymentRows.slice(0, 5).map(payment => (
                <div key={payment.external_id ?? payment.transaction_id ?? String(payment.id)} className="flex items-center justify-between rounded-xl bg-[#f7faf8] p-3">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#29463b]">{payment.external_id ?? payment.transaction_id ?? String(payment.id)}</p><p className="text-xs text-[#81928a]">{paymentProviderLabel(payment.provider)} · {payment.phone_number ?? "Numéro non renseigné"}</p></div>
                  <div className="text-right"><p className="text-sm font-semibold text-[#1D7159]">{Number(payment.amount ?? 0).toLocaleString("fr-FR")} FCFA</p><p className="text-xs text-[#81928a]">{paymentStatusLabel(payment.status)}</p></div>
                </div>
              ))}
            </div>
          ) : <div className="mt-5 rounded-xl bg-[#f7faf8] p-4 text-sm text-[#81928a]">Aucune transaction réelle disponible.</div>}
        </section>
        <section className="rounded-2xl border border-[#e4ebe7] bg-white p-5">
          <h2 className="font-semibold text-[#29463b]">À traiter maintenant</h2>
          <p className="mt-1 text-xs text-[#8a9d94]">
            Seuls les compteurs Supabase disponibles sont affichés.
          </p>
          <div className="mt-5 space-y-3">
            <button
              onClick={() => setLocation("/invoices")}
              className="flex w-full items-center justify-between rounded-xl border border-[#edf1ef] p-3 text-left"
            >
              <span className="text-sm font-medium text-[#526a60]">
                Factures en attente
              </span>
              <span className="font-bold text-[#29463b]">
                {overview?.pendingInvoices ?? "—"}
              </span>
            </button>
            <button
              onClick={() => setLocation("/reviews")}
              className="flex w-full items-center justify-between rounded-xl border border-[#edf1ef] p-3 text-left"
            >
              <span className="text-sm font-medium text-[#526a60]">
                Avis réels enregistrés
              </span>
              <span className="font-bold text-[#29463b]">
                {overview?.reviews ?? "—"}
              </span>
            </button>
          </div>
        </section>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#e4ebe7] bg-white p-5">
          <h2 className="font-semibold text-[#29463b]">
            Paiements des 7 derniers jours
          </h2>
          <p className="mt-1 text-xs text-[#8a9d94]">
            Graphique affiché uniquement si des paiements réels sont
            disponibles.
          </p>
          <div className="mt-6 rounded-xl bg-[#f7faf8] p-4 text-sm text-[#81928a]">
            {hasPaymentData
              ? `${paymentRows.length} paiements réels chargés. Le détail temporel sera calculé après normalisation des dates.`
              : "Aucun paiement réel disponible."}
          </div>
        </section>
        <section className="rounded-2xl border border-[#e4ebe7] bg-white p-5">
          <h2 className="font-semibold text-[#29463b]">Répartition KPay</h2>
          <p className="mt-1 text-xs text-[#8a9d94]">
            Calculée à partir des statuts Supabase.
          </p>
          <div className="mt-6 rounded-xl bg-[#f7faf8] p-4 text-sm text-[#81928a]">
            {hasPaymentData
              ? `Confirmés : ${confirmedCount} / ${totalPaymentCount} · Taux : ${successRate}`
              : "Aucune donnée réelle disponible."}
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-2xl border border-[#e4ebe7] bg-white p-5">
        <h2 className="font-semibold text-[#29463b]">
          Répartition géographique
        </h2>
        <p className="mt-1 text-xs text-[#8a9d94]">
          Garages réels normalisés au Congo-Brazzaville.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {cities.map(city => (
            <div key={city} className="rounded-xl bg-[#f7faf8] p-4">
              <p className="text-sm text-[#6f857b]">{city}</p>
              <p className="mt-2 text-2xl font-bold text-[#1D7159]">
                {cityCounts[city] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-2xl border border-[#e4ebe7] bg-white p-5">
        <h2 className="font-semibold text-[#29463b]">Synthèse économique</h2>
        <p className="mt-1 text-xs text-[#8a9d94]">Calculée uniquement à partir des paiements KPay réellement chargés.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-[#e8f3ee] p-4"><p className="text-xs text-[#6f857b]">Revenus confirmés</p><p className="mt-2 text-xl font-bold text-[#1D7159]">{formatFcfa(confirmedRevenue)}</p></div>
          <div className="rounded-xl bg-[#fff7df] p-4"><p className="text-xs text-[#6f857b]">En attente</p><p className="mt-2 text-xl font-bold text-[#9b7414]">{formatFcfa(pendingRevenue)}</p></div>
          <div className="rounded-xl bg-[#f7faf8] p-4"><p className="text-xs text-[#6f857b]">Dépenses</p><p className="mt-2 text-sm font-semibold text-[#81928a]">Non renseignées</p></div>
          <div className="rounded-xl bg-[#f7faf8] p-4"><p className="text-xs text-[#6f857b]">Bénéfice net</p><p className="mt-2 text-sm font-semibold text-[#81928a]">Non calculable</p></div>
        </div>
        <p className="mt-4 text-xs leading-5 text-[#81928a]">Pour calculer un bénéfice net fiable, il faudra enregistrer les dépenses réelles et les commissions par modèle économique. Aucun montant n’est inventé ici.</p>
      </section>
    </div>
  );
}

function ListPage({
  type,
  title,
  description,
  rows,
}: {
  type: "garage" | "user" | "payment" | "invoice" | "review";
  title: string;
  description: string;
  rows: Row[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tous les statuts");
  const garagesQuery = trpc.admin.garages.useQuery(undefined, {
    enabled: type === "garage",
  });
  const usersQuery = trpc.admin.users.useQuery(undefined, {
    enabled: type === "user",
  });
  const invoicesQuery = trpc.admin.invoices.useQuery(undefined, {
    enabled: type === "invoice",
  });
  const paymentsQuery = trpc.admin.payments.useQuery(undefined, {
    enabled: type === "payment",
  });
  const liveRows = useMemo<Row[] | null>(() => {
    if (type === "garage" && garagesQuery.data?.length)
      return garagesQuery.data.map(item => ({
        id: String(item.id),
        name: item.name,
        meta: `${item.address} · ${item.neighborhood}`,
        status: item.certified ? "Publié" : "À valider",
        statusTone: item.certified ? "green" : "gold",
        extra: item.phone,
        icon: Building2,
      }));
    if (type === "user" && usersQuery.data?.length)
      return usersQuery.data.map(item => ({
        id: item.id,
        name:
          `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() ||
          item.email ||
          item.id,
        meta: `${item.email ?? item.phone ?? "Contact non renseigné"} · ${item.account_type}`,
        status: "Actif",
        statusTone: "green",
        extra: item.onboarding_completed
          ? "Profil terminé"
          : "Profil incomplet",
        icon: UserRound,
      }));
    if (type === "invoice" && invoicesQuery.data?.length)
      return invoicesQuery.data.map(item => ({
        id: item.id,
        name: item.id,
        meta: `Garage #${item.garage_id} · ${item.client_id ?? "Client non renseigné"}`,
        status: invoiceStatusLabel(item.status),
        statusTone:
          item.status === "paid"
            ? "green"
            : ["failed", "expired", "cancelled"].includes(String(item.status))
              ? "red"
              : "gold",
        amount: `${Number(item.amount ?? 0).toLocaleString("fr-FR")} ${item.currency}`,
        extra: item.description ?? "Facture réelle Supabase",
        icon: FileText,
      }));
    if (type === "payment" && paymentsQuery.data?.length)
      return paymentsQuery.data.map(item => ({
        id: item.external_id ?? item.transaction_id ?? String(item.id),
        name: item.external_id ?? item.transaction_id ?? String(item.id),
        meta: `${paymentProviderLabel(item.provider)} · ${item.phone_number ?? "Numéro non renseigné"}`,
        status: paymentStatusLabel(item.status),
        statusTone:
          ["paid", "success", "succeeded", "completed", "confirmed"].includes(String(item.status).toLowerCase())
            ? "green"
            : ["failed", "failure", "error", "cancelled", "canceled", "expired"].includes(String(item.status).toLowerCase())
              ? "red"
              : "gold",
        amount: `${Number(item.amount ?? 0).toLocaleString("fr-FR")} FCFA`,
        extra: item.transaction_id ?? item.invoice_id ?? "Transaction réelle",
        icon: CreditCard,
      }));
    return null;
  }, [
    garagesQuery.data,
    usersQuery.data,
    invoicesQuery.data,
    paymentsQuery.data,
    type,
  ]);
  const displayRows = liveRows ?? [];
  const secondaryOptions = useMemo(() => {
    const defaultOption =
      type === "garage"
        ? "Toutes les villes"
        : type === "user"
          ? "Tous les rôles"
          : type === "invoice"
            ? "Tous les garages"
            : type === "payment"
              ? "Tous les fournisseurs"
              : "Tous";
    const fixedOptions = type === "payment" ? ["MTN Mobile Money", "Airtel Money", "KPay"] : [];
    const liveOptions = displayRows.map(row => row.meta.split(" · ")[0]).filter(Boolean);
    return Array.from(new Set([defaultOption, ...fixedOptions, ...liveOptions]));
  }, [type, displayRows]);
  const [secondary, setSecondary] = useState(secondaryOptions[0] ?? "Tous");
  const filtered = useMemo(
    () =>
      displayRows.filter(
        row =>
          `${row.name} ${row.meta} ${row.id}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (status === "Tous les statuts" || row.status === status) &&
          (secondary === "Tous" ||
            secondary === "Toutes les villes" ||
            secondary === "Tous les rôles" ||
            secondary === "Tous les garages" ||
            secondary === "Tous les fournisseurs" ||
            row.meta.toLowerCase().includes(secondary.toLowerCase()))
      ),
    [displayRows, query, status, secondary]
  );
  const action = (
    <ExportButton
      filename={`wapigarage-${type}.csv`}
      rows={filtered}
      label={`Exporter ${title.toLowerCase()}`}
    />
  );
  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Gestion opérationnelle"
        title={title}
        description={description}
        action={action}
      />
      <FilterBar
        placeholder={`Rechercher dans ${title.toLowerCase()}...`}
        onChange={setQuery}
        status={status}
        onStatusChange={setStatus}
        secondary={secondary}
        onSecondaryChange={setSecondary}
        secondaryOptions={secondaryOptions}
        statusOptions={type === "payment" ? ["Tous les statuts", "Payé", "En attente", "Échoué", "Annulé", "Expiré"] : type === "invoice" ? ["Tous les statuts", "Émise", "En attente de paiement", "Payée", "Échec du paiement", "Expirée", "Annulée"] : undefined}
        secondaryLabel={
          type === "garage"
            ? "Filtrer par ville"
            : type === "user"
              ? "Filtrer par rôle"
              : type === "payment"
                ? "Filtrer par fournisseur"
                : "Filtrer par garage"
        }
      />
      <DataTable rows={filtered} type={type} live={liveRows !== null} />
    </div>
  );
}

function ReviewModerationPage() {
  const [section, setSection] = useState("Signalement");
  const reviewsQuery = trpc.admin.reviews.useQuery();
  const supportReportsQuery = trpc.admin.supportReports.useQuery();
  const liveReviewRows = useMemo<Row[]>(
    () =>
      (reviewsQuery.data ?? []).map(review => ({
        id: String(review.id),
        name: `Avis utilisateur ${review.user_id}`,
        meta: `Garage #${review.garage_id} · ${review.rating}/5 · Facture ${review.invoice_id ?? "non liée"}`,
        status: "Publié",
        statusTone: "green",
        extra: review.comment ?? "Sans commentaire",
        icon: Star,
      })),
    [reviewsQuery.data]
  );
  const [reviewState, setReviewState] = useState(reviews);
  useEffect(() => {
    if (reviewsQuery.data) setReviewState(liveReviewRows);
  }, [liveReviewRows, reviewsQuery.data]);
  const sections = ["Signalement", "Récents", "Masqués"];
  const items =
    section === "Signalement"
      ? reviewState.filter(
          review =>
            review.status === "Signalement" || review.status === "À examiner"
        )
      : section === "Masqués"
        ? reviewState.filter(review => review.status === "Masqué")
        : reviewState.filter(review => review.status === "Publié");
  const updateReview = (
    id: string,
    status: Row["status"],
    statusTone: Row["statusTone"]
  ) => {
    setReviewState(current =>
      current.map(review =>
        review.id === id ? { ...review, status, statusTone } : review
      )
    );
  };
  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Gestion opérationnelle"
        title="Avis et modération"
        description="Examine les avis faisant l’objet d’un signalement, protège la qualité des échanges et conserve la preuve du paiement."
        action={
          <ExportButton filename="wapigarage-avis.csv" rows={reviewState} />
        }
      />
      <div className="mb-5 flex gap-2 overflow-x-auto rounded-2xl border border-[#e4ebe7] bg-white p-2">
        {sections.map(item => (
          <button
            key={item}
            onClick={() => setSection(item)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${section === item ? "bg-[#e5f1ec] text-[#1D7159]" : "text-[#83958c] hover:bg-[#f7faf8]"}`}
          >
            {item}
            <span className="ml-2 rounded-full bg-[#fff4d2] px-1.5 py-0.5 text-[10px] text-[#8a6200]">
              {
                reviewState.filter(review =>
                  item === "Signalement"
                    ? review.status === "Signalement" ||
                      review.status === "À examiner"
                    : item === "Masqués"
                      ? review.status === "Masqué"
                      : review.status === "Publié"
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
        <div className="rounded-2xl border border-[#e4ebe7] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[#29463b]">
              {section === "Signalement"
                ? "Avis faisant l’objet d’un signalement"
                : `Avis ${section.toLowerCase()}`}
            </h2>
            <Badge className="bg-[#e8f3ee] text-[#1D7159]">
              {items.length} élément(s)
            </Badge>
          </div>
          <div className="space-y-3">
            {section === "Signalement" && (supportReportsQuery.data ?? []).map(report => {
              const record = report as Record<string, unknown>;
              const reportDate = record.created_at ? new Date(String(record.created_at)).toLocaleString("fr-FR") : "Date non renseignée";
              const invoiceReference = record.invoice_id ?? record.related_id ?? record.invoice_number ?? "Facture non renseignée";
              return <div key={`report-${String(record.id)}`} className="rounded-2xl border border-[#f1dfaa] bg-[#fffaf0] p-4"><p className="font-semibold text-[#6f5200]">Signalement · {String(record.type ?? "Objet non renseigné")}</p><p className="mt-1 text-sm text-[#806f43]">Auteur : {String(record.user_id ?? "Utilisateur non renseigné")} · {reportDate}</p><p className="mt-2 text-sm text-[#66542a]">Objet : {String(record.subject ?? record.description ?? "Contenu non renseigné")}</p><p className="mt-1 text-xs text-[#806f43]">Facture : {String(invoiceReference)}</p></div>;
            })}
            {items.length === 0 ? (
              <p className="rounded-xl bg-[#f7faf8] p-4 text-sm text-[#81928a]">
                Aucun avis réel chargé. Cette zone sera alimentée par les avis
                liés à des factures payées.
              </p>
            ) : (
              items.map(review => (
                <div
                  key={review.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#edf1ef] p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff5d8] text-[#9a6d00]">
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#355247]">
                      {review.name}
                    </p>
                    <p className="mt-1 text-sm text-[#81928a]">{review.meta}</p>
                    <p className="mt-2 text-xs text-[#a0aea8]">
                      {review.extra}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={review.statusTone}>
                      {review.status}
                    </StatusBadge>
                    {section !== "Masqués" ? (
                      <Button
                        onClick={() => {
                          updateReview(
                            review.id,
                            section === "Signalement" ? "Publié" : "Masqué",
                            section === "Signalement" ? "green" : "gray"
                          );
                          toast.success(
                            section === "Signalement"
                              ? "Avis approuvé"
                              : "Avis masqué"
                          );
                        }}
                        variant="outline"
                        className="rounded-xl border-[#dce8e2] text-[#1D7159]"
                      >
                        {section === "Signalement" ? "Approuver" : "Masquer"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          updateReview(review.id, "Publié", "green");
                          toast.success("Avis restauré");
                        }}
                        variant="outline"
                        className="rounded-xl border-[#dce8e2] text-[#1D7159]"
                      >
                        Restaurer
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl bg-[#1D7159] p-6 text-white">
          <ShieldCheck className="h-7 w-7 text-[#cce3d8]" />
          <h2 className="mt-5 text-lg font-semibold">Panneau de modération</h2>
          <p className="mt-2 text-sm leading-6 text-[#d6ebe2]">
            Chaque avis est relié à une facture payée. Les actions sont
            journalisées pour protéger les clients et les garages.
          </p>
          <div className="mt-6 rounded-xl bg-white/10 p-4">
            <p className="text-xs text-[#cce3d8]">Règle appliquée</p>
            <p className="mt-1 text-sm font-semibold">
              Un avis par facture confirmée
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDetailPage({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const userDetailQuery = trpc.admin.userDetail.useQuery({ id });
  const live = userDetailQuery.data;
  if (!live)
    return (
      <div className="mx-auto max-w-[1200px]">
        <PageHeader
          eyebrow="Utilisateur"
          title="Détail indisponible"
          description="Aucune donnée réelle n’a été renvoyée par Supabase pour cet utilisateur."
        />
        <Button variant="outline" onClick={() => setLocation("/users")}>
          Retour aux utilisateurs
        </Button>
      </div>
    );
  const userName =
    `${live.user.first_name ?? ""} ${live.user.last_name ?? ""}`.trim() ||
    live.user.email ||
    live.user.id;
  const reviews = live.reviews.map(
    review =>
      `${review.rating}/5 · ${review.comment ?? "Sans commentaire"} · Facture ${review.invoice_id ?? "non liée"}`
  );
  const linkedGarage = live.professionalGarage
    ? {
        id: String(live.professionalGarage.id),
        name: live.professionalGarage.name,
        meta: `${live.professionalGarage.address ?? ""} · ${live.professionalGarage.neighborhood ?? ""}`,
      }
    : null;
  return (
    <div className="mx-auto max-w-[1280px]">
      <button
        onClick={() => setLocation("/users")}
        className="mb-5 flex items-center gap-1 text-sm font-semibold text-[#1D7159] hover:underline"
      >
        <ChevronRight className="h-4 w-4 rotate-180" /> Retour aux utilisateurs
      </button>
      <div className="mb-6 rounded-2xl border border-[#e4ebe7] bg-white p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#1D7159]">
          Utilisateur réel
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#1e3b31]">{userName}</h1>
        <p className="mt-1 text-sm text-[#80928a]">
          {live.user.id} · {live.user.account_type}
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-[#f7faf8] p-4">
            <p className="text-xs text-[#879990]">Contact</p>
            <p className="mt-2 text-sm font-semibold text-[#29463b]">
              {live.user.email ?? live.user.phone ?? "Non renseigné"}
            </p>
          </div>
          <div className="rounded-xl bg-[#f7faf8] p-4">
            <p className="text-xs text-[#879990]">Avis laissés</p>
            <p className="mt-2 text-xl font-bold text-[#1D7159]">
              {reviews.length}
            </p>
          </div>
          <div className="rounded-xl bg-[#f7faf8] p-4">
            <p className="text-xs text-[#879990]">Paiements</p>
            <p className="mt-2 text-xl font-bold text-[#29463b]">
              {live.paymentCount}
            </p>
          </div>
          <div className="rounded-xl bg-[#f7faf8] p-4">
            <p className="text-xs text-[#879990]">Compte professionnel</p>
            <p className="mt-2 text-sm font-semibold text-[#1D7159]">
              {linkedGarage ? "Oui" : "Non"}
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#e4ebe7] bg-white p-5">
          <h2 className="font-semibold text-[#29463b]">
            Avis réels laissés sur l’application
          </h2>
          <div className="mt-5 space-y-3">
            {reviews.length ? (
              reviews.map(review => (
                <div
                  key={review}
                  className="rounded-xl border border-[#edf1ef] p-4 text-sm text-[#486057]"
                >
                  {review}
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-[#f7faf8] p-4 text-sm text-[#81928a]">
                Aucun avis réel pour cet utilisateur.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-[#e4ebe7] bg-white p-5">
          <h2 className="font-semibold text-[#29463b]">
            Compte professionnel réel
          </h2>
          {linkedGarage ? (
            <button
              className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#e8f3ee] p-4 text-left text-[#1D7159]"
              onClick={() => setLocation(`/garages/${linkedGarage.id}`)}
            >
              <span>
                <span className="block font-bold">{linkedGarage.name}</span>
                <span className="mt-1 block text-xs text-[#6f8a7d]">
                  {linkedGarage.meta}
                </span>
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <p className="mt-3 text-sm text-[#81928a]">
              Aucun compte professionnel réel associé.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function DetailPage({
  type,
  id,
}: {
  type: "garage" | "user" | "payment" | "invoice";
  id: string;
}) {
  const [, setLocation] = useLocation();
  const garagesQuery = trpc.admin.garages.useQuery();
  const paymentsQuery = trpc.admin.payments.useQuery();
  const invoicesQuery = trpc.admin.invoices.useQuery();
  const usersQuery = trpc.admin.users.useQuery();
  const source =
    type === "garage"
      ? garagesQuery.data
      : type === "payment"
        ? paymentsQuery.data
        : type === "invoice"
          ? invoicesQuery.data
          : usersQuery.data;
  const row = source?.find(item => String(item.id) === id);
  const title = row
    ? "name" in row && row.name
      ? row.name
      : String(row.id)
    : "Détail indisponible";
  const label =
    type === "garage"
      ? "Garage"
      : type === "payment"
        ? "Paiement"
        : type === "invoice"
          ? "Facture"
          : "Utilisateur";
  const rows: string[] = row
    ? Object.entries(row as Record<string, unknown>)
        .filter(([key]) => !["id", "created_at", "updated_at"].includes(key))
        .slice(0, 16)
        .map(([key, value]) => {
          if (key === "client_author" && value && typeof value === "object") {
            const author = value as { first_name?: string; last_name?: string; email?: string; phone?: string; account_type?: string };
            return `Auteur client · ${[author.first_name, author.last_name].filter(Boolean).join(" ") || "Nom non renseigné"} · ${author.email ?? author.phone ?? "Contact non renseigné"}`;
          }
          if (key === "garage_author" && value && typeof value === "object") {
            const garage = value as { name?: string; phone?: string; neighborhood?: string; address?: string };
            return `Garage pro · ${garage.name ?? "Nom non renseigné"} · ${garage.phone ?? garage.address ?? garage.neighborhood ?? "Contact non renseigné"}`;
          }
          return `${key} · ${value == null ? "Non renseigné" : String(value)}`;
        })
    : [];
  const invoiceActorRows = type === "invoice" && row
    ? (() => {
        const record = row as Record<string, unknown>;
        const client = record.client_author as { first_name?: string; last_name?: string; email?: string; phone?: string } | null;
        const garage = record.garage_author as { name?: string; phone?: string; address?: string; neighborhood?: string } | null;
        const payer = record.payer as { phone_number?: string; provider?: string; status?: string; external_id?: string; transaction_id?: string } | null;
        return [
          { key: "invoice-garage", label: "Pro émetteur", value: garage ? `${garage.name ?? "Nom non renseigné"} · ${garage.phone ?? garage.address ?? garage.neighborhood ?? "Contact non renseigné"}` : "Non renseigné" },
          { key: "invoice-client", label: "Client bénéficiaire", value: client ? `${[client.first_name, client.last_name].filter(Boolean).join(" ") || "Nom non renseigné"} · ${client.email ?? client.phone ?? "Contact non renseigné"}` : "Aucun compte client associé" },
          { key: "invoice-payer", label: "Numéro réellement payeur", value: payer ? `${payer.phone_number ?? "Numéro non renseigné"} · ${paymentProviderLabel(payer.provider)} · ${paymentStatusLabel(payer.status)}` : "Aucun paiement lié à cette facture" },
        ];
      })()
    : [];
  return (
    <div className="mx-auto max-w-[1280px]">
      <button
        onClick={() =>
          setLocation(
            type === "garage"
              ? "/garages"
              : type === "payment"
                ? "/payments"
                : type === "invoice"
                  ? "/invoices"
                  : "/users"
          )
        }
        className="mb-5 flex items-center gap-1 text-sm font-semibold text-[#1D7159] hover:underline"
      >
        <ChevronRight className="h-4 w-4 rotate-180" /> Retour à la liste
      </button>
      <PageHeader
        eyebrow={label}
        title={title}
        description={
          row
            ? "Données chargées depuis Supabase."
            : "Aucune donnée réelle n’a été trouvée pour cet identifiant."
        }
        action={
          <ExportButton
            filename={`wapigarage-${type}-${id}.csv`}
            rows={
              row
                ? [
                    {
                      id: String(row.id),
                      name: title,
                      meta: rows.join(" · "),
                      status: "Réel",
                      statusTone: "green",
                    },
                  ]
                : []
            }
          />
        }
      />
      <div className="rounded-2xl border border-[#e4ebe7] bg-white p-6">
        {row ? (
          <>
            {type === "invoice" && (
              <div className="mb-5 grid gap-3 md:grid-cols-3">
                {invoiceActorRows.map(actor => (
                  <div key={actor.key} className="rounded-xl border border-[#e4ebe7] bg-[#f7faf8] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#81928a]">{actor.label}</p>
                    <p className="mt-2 text-sm font-semibold text-[#29463b]">{actor.value}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {rows.map((item, index) => (
                <div
                  key={`${type}-${id}-${index}`}
                  className="rounded-xl bg-[#f7faf8] p-4 text-sm text-[#486057]"
                >
                  {item}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="rounded-xl bg-[#f7faf8] p-5 text-sm text-[#81928a]">
            Aucune donnée réelle disponible.
          </p>
        )}
      </div>
    </div>
  );
}

function SupportPage() {
  const conversationsQuery = trpc.admin.conversations.useQuery();
  const messagesQuery = trpc.admin.messages.useQuery();
  const reportsQuery = trpc.admin.supportReports.useQuery();
  const displayThreads = useMemo(() => {
    const reports = (reportsQuery.data ?? []).map(report => {
      const record = report as Record<string, unknown>;
      const kind = String(record.type ?? record.category ?? "Signalement");
      const subject = String(record.subject ?? record.title ?? "Demande support sans objet");
      const description = String(record.description ?? record.message ?? record.content ?? "Contenu non renseigné");
      return {
        id: `report-${String(record.id)}`,
        subject: `${kind} · ${subject}`,
        sender: `Utilisateur ${String(record.user_id ?? record.client_id ?? "non renseigné")}`,
        target: "Support WapiGarage",
        priority: "À traiter",
        status: "Nouveau",
        content: description,
      };
    });
    const conversations = (conversationsQuery.data ?? []).map(conversation => {
      const latestMessage = messagesQuery.data?.find(
        message => message.conversation_id === conversation.id
      );
      return {
        id: `conversation-${conversation.id}`,
        subject: `Conversation support #${conversation.id}`,
        sender: `Client ${conversation.client_id}`,
        target: `Garage #${conversation.garage_id}`,
        priority:
          conversation.client_unread_count + conversation.garage_unread_count >
          0
            ? "Haute"
            : "Normale",
        status: "Ouvert",
        content:
          latestMessage?.content ??
          conversation.last_message ??
          "Aucun message disponible",
      };
    });
    return [...reports, ...conversations];
  }, [conversationsQuery.data, messagesQuery.data, reportsQuery.data]);
  const [selectedThread, setSelectedThread] = useState<
    (typeof supportThreads)[number] | null
  >(null);
  const [reviewedThreadId, setReviewedThreadId] = useState<string | null>(null);
  const [pendingThread, setPendingThread] = useState<
    (typeof supportThreads)[number] | null
  >(null);
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Gestion opérationnelle"
        title="Signalements et support"
        description="Consulte les plaintes de bug, suggestions d’amélioration et messages support avant toute action."
        action={
          <ExportButton
            filename="wapigarage-support.csv"
            rows={displayThreads.map(thread => ({
              id: thread.id,
              name: thread.subject,
              meta: `${thread.sender} · ${thread.target}`,
              status: thread.status,
              statusTone: thread.priority === "Haute" ? "red" : "gold",
              extra: thread.priority,
            }))}
          />
        }
      />
      <div className="space-y-3">
            {displayThreads.length === 0 ? (
              <p className="rounded-xl bg-[#f7faf8] p-5 text-sm text-[#81928a]">Aucun signalement ou message support réel disponible.</p>
            ) : displayThreads.map(thread => (
          <div
            key={thread.id}
            className="flex flex-col gap-4 rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_4px_20px_rgba(34,70,55,0.03)] md:flex-row md:items-center"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f3ee] text-[#1D7159]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-[#29463b]">
                  {thread.subject}
                </h2>
                <StatusBadge
                  tone={thread.priority === "Haute" ? "red" : "gold"}
                >
                  {thread.priority}
                </StatusBadge>
              </div>
              <p className="mt-1 text-sm text-[#81928a]">
                {thread.sender} · {thread.target} · {thread.status}
              </p>
              <p className="mt-2 truncate text-sm text-[#60766c]">
                {thread.content}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                className="rounded-xl border-[#dce8e2] text-[#1D7159]"
                onClick={() => setSelectedThread(thread)}
              >
                Voir le contenu
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-[#e7d5d2] text-[#b33a30]"
                onClick={() => {
                  const workflow = openSupportThread(
                    {
                      selectedThreadId: selectedThread?.id ?? null,
                      reviewedThreadId,
                      confirmationOpen: false,
                    },
                    thread.id
                  );
                  setSelectedThread(thread);
                  setReviewedThreadId(
                    markSupportThreadReviewed(workflow, thread.id)
                      .reviewedThreadId
                  );
                }}
              >
                Examiner avant suspension
              </Button>
            </div>
          </div>
        ))}
      </div>
      <MessagePreviewDialog
        thread={selectedThread}
        open={selectedThread !== null}
        onClose={() => setSelectedThread(null)}
        onSuspend={() => {
          const workflow: SupportWorkflowState = {
            selectedThreadId: selectedThread?.id ?? null,
            reviewedThreadId,
            confirmationOpen: false,
          };
          const nextWorkflow = openSuspensionConfirmation(workflow);
          if (
            canSuspendAfterSupportRead(workflow) &&
            nextWorkflow.confirmationOpen &&
            selectedThread
          )
            setPendingThread(selectedThread);
        }}
      />
      <ConfirmActionDialog
        open={pendingThread !== null}
        title="Confirmer la suspension après lecture"
        description={
          pendingThread
            ? `Vous avez consulté le message « ${pendingThread.subject} ». Confirmez-vous la suspension de la personne associée (${pendingThread.target}) ?`
            : ""
        }
        confirmLabel="Confirmer la suspension"
        onCancel={() => setPendingThread(null)}
        onConfirm={() => {
          toast.success(
            `Suspension confirmée après lecture · ${pendingThread?.sender}`
          );
          setPendingThread(null);
          setSelectedThread(null);
        }}
      />
    </div>
  );
}

function ReportsPage() {
  const financeQuery = trpc.admin.finance.useQuery();
  const addEntry = trpc.admin.addFinanceEntry.useMutation({ onSuccess: () => financeQuery.refetch(), onError: error => toast.error(error.message) });
  const updateSettings = trpc.admin.updateFinanceSettings.useMutation({ onSuccess: () => financeQuery.refetch(), onError: error => toast.error(error.message) });
  const [entryType, setEntryType] = useState<"advertising_revenue" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const reportRows = [...payments, ...invoices, ...reviews];
  const finance = financeQuery.data;
  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      <PageHeader eyebrow="Administration" title="Rapports exportables" description="Les montants financiers proviennent uniquement des paiements, abonnements et écritures réelles Supabase." action={<ExportButton filename="wapigarage-rapport-complet.csv" rows={reportRows} label="Exporter le rapport complet" />} />
      <div className="grid gap-4 md:grid-cols-5">
        {[['Paiements nets', finance?.paymentRevenue, true], ['Commission transactions', finance?.commissionRevenue, finance?.commissionKnown], ['Abonnements actifs', finance?.subscriptionRevenue, true], ['Publicité', finance?.advertisingRevenue, true], ['Dépenses', finance?.expenses, finance?.expensesKnown], ['Bénéfice net', finance?.netProfit, finance?.expensesKnown]].map(([label, value, known]) => <div key={String(label)} className="rounded-2xl border border-[#e4ebe7] bg-white p-5"><p className="text-xs text-[#879990]">{label}</p><p className="mt-2 text-2xl font-bold text-[#29463b]">{known && value != null ? `${Number(value).toLocaleString("fr-FR")} FCFA` : "Non calculable"}</p><p className="mt-2 text-xs text-[#81928a]">{known ? "Données Supabase" : "Aucune donnée réelle suffisante"}</p></div>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#e4ebe7] bg-white p-5"><h2 className="font-semibold text-[#29463b]">Paramètres de commission</h2><p className="mt-1 text-sm text-[#81928a]">Le taux est vide tant qu’aucun paramètre réel n’est enregistré.</p><div className="mt-4 flex gap-3"><input aria-label="Taux de commission" type="number" min="0" max="100" step="0.01" value={commissionRate || String(finance?.settings?.commission_rate ?? "")} onChange={event => setCommissionRate(event.target.value)} placeholder="Taux en %" className="h-10 flex-1 rounded-xl border border-[#dce8e2] px-3" /><Button disabled={!commissionRate || updateSettings.isPending} onClick={() => updateSettings.mutate({ commissionRate: Number(commissionRate), currency: "XAF" })} className="rounded-xl bg-[#1D7159] text-white">Enregistrer</Button></div></section>
        <section className="rounded-2xl border border-[#e4ebe7] bg-white p-5"><h2 className="font-semibold text-[#29463b]">Ajouter une écriture réelle</h2><div className="mt-4 grid gap-3"><select aria-label="Type d’écriture" value={entryType} onChange={event => setEntryType(event.target.value as typeof entryType)} className="h-10 rounded-xl border border-[#dce8e2] px-3"><option value="expense">Dépense</option><option value="advertising_revenue">Recette publicitaire</option></select><input aria-label="Catégorie" value={category} onChange={event => setCategory(event.target.value)} placeholder="Catégorie réelle" className="h-10 rounded-xl border border-[#dce8e2] px-3" /><input aria-label="Montant" type="number" min="0" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Montant en FCFA" className="h-10 rounded-xl border border-[#dce8e2] px-3" /><Button disabled={!category.trim() || !amount || addEntry.isPending} onClick={() => addEntry.mutate({ entryType, category: category.trim(), amount: Number(amount), currency: "XAF", occurredAt: new Date().toISOString() })} className="rounded-xl bg-[#1D7159] text-white">Enregistrer l’écriture</Button></div></section>
      </div>
      <div className="grid gap-4 md:grid-cols-3">{[{ label: "Paiements réels", value: payments.length, rows: payments, file: "wapigarage-paiements.csv" }, { label: "Factures réelles", value: invoices.length, rows: invoices, file: "wapigarage-factures.csv" }, { label: "Avis et signalements", value: reviews.length, rows: reviews, file: "wapigarage-avis.csv" }].map(report => <div key={report.file} className="rounded-2xl border border-[#e4ebe7] bg-white p-5"><p className="text-xs text-[#879990]">{report.label}</p><p className="mt-2 text-3xl font-bold text-[#29463b]">{report.value}</p><Button variant="outline" className="mt-5 w-full rounded-xl border-[#dce8e2] text-[#1D7159]" onClick={() => downloadCsv(report.file, report.rows)}>Télécharger CSV</Button></div>)}</div>
    </div>
  );
}

function SettingsPage() {
  const [section, setSection] = useState("Plateforme");
  const [bannerNumber, setBannerNumber] = useState("1");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerFile, setBannerFile] = useState<{ dataBase64: string; contentType: "image/jpeg" | "image/png" | "image/webp"; name: string } | null>(null);
  const bannersQuery = trpc.admin.banners.useQuery();
  const uploadBanner = trpc.admin.uploadBanner.useMutation({
    onSuccess: async () => {
      await bannersQuery.refetch();
      setBannerFile(null);
      setBannerTitle("");
      toast.success("Bannière enregistrée en brouillon");
    },
    onError: error => toast.error(error.message),
  });
  const updateBannerStatus = trpc.admin.updateBannerStatus.useMutation({
    onSuccess: async () => { await bannersQuery.refetch(); toast.success("Statut de la bannière mis à jour"); },
    onError: error => toast.error(error.message),
  });
  const handleBannerFile = (file: File | undefined) => {
    if (!file) return;
    if (!(["image/jpeg", "image/png", "image/webp"] as string[]).includes(file.type)) {
      toast.error("Format accepté : JPG, PNG ou WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La photo ne doit pas dépasser 5 Mo");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const dataBase64 = result.split(",")[1];
      if (dataBase64) setBannerFile({ dataBase64, contentType: file.type as "image/jpeg" | "image/png" | "image/webp", name: file.name });
    };
    reader.readAsDataURL(file);
  };
  const sections = [
    {
      name: "Plateforme",
      description: "Devise, villes et support",
      icon: Settings,
    },
    { name: "KPay", description: "Sandbox et webhook", icon: CreditCard },
    { name: "Infobip", description: "OTP et expéditeur", icon: MessageSquare },
    { name: "OAuth", description: "URI autorisées", icon: LockKeyhole },
    { name: "Administrateurs", description: "Rôles et sessions", icon: Users },
    { name: "Bannières", description: "Images de l’application", icon: ImageIcon },
  ];
  const content: Record<
    string,
    { title: string; description: string; fields: string[] }
  > = {
    Plateforme: {
      title: "Configuration de la plateforme",
      description:
        "Les réglages généraux affichés aux équipes et aux utilisateurs.",
      fields: [
        "Devise par défaut · XAF",
        "Villes couvertes · Brazzaville, Pointe-Noire, Dolisie",
        "Email support · support@wapigarage.app",
      ],
    },
    KPay: {
      title: "Intégration KPay",
      description:
        "Surveille les paramètres de paiement et la réception des webhooks.",
      fields: [
        "Environnement · Sandbox",
        "Webhook · Signature HMAC active",
        "Dernier contrôle · Il y a 12 min",
      ],
    },
    Infobip: {
      title: "Intégration Infobip",
      description:
        "Configure l’OTP et l’expéditeur des messages transactionnels.",
      fields: [
        "Service · OTP SMS",
        "Expéditeur · WapiGarage",
        "Limite OTP · 5 tentatives par heure",
      ],
    },
    OAuth: {
      title: "Sécurité OAuth",
      description:
        "Contrôle les URI autorisées et le comportement des sessions.",
      fields: [
        "Fournisseur · Google OAuth",
        "Allowlist · 3 URI autorisées",
        "Échange · Code temporaire à usage unique",
      ],
    },
    Bannières: {
      title: "Bannières de l’application",
      description: "Ajoute une image numérotée qui pourra être publiée progressivement dans l’application.",
      fields: ["Stockage · S3 sécurisé", "Formats · JPG, PNG, WebP", "Taille maximale · 5 Mo"],
    },
    Administrateurs: {
      title: "Administrateurs",
      description: "Gère les rôles et les sessions de l’équipe de contrôle.",
      fields: [
        "Admin principal · Propriétaire",
        "Support · Lecture et modération",
        "Sessions actives · 2",
      ],
    },
  };
  const active = content[section];
  const ActiveIcon =
    sections.find(item => item.name === section)?.icon ?? Settings;
  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Administration"
        title="Paramètres"
        description="Configure la plateforme, les intégrations et les accès administrateurs."
        action={
          <Button
            onClick={() => toast.success("Paramètres enregistrés")}
            className="h-10 rounded-xl bg-[#1D7159] text-white hover:bg-[#165b47]"
          >
            Enregistrer
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[270px_1fr]">
        <nav
          className="space-y-2 rounded-2xl border border-[#e4ebe7] bg-white p-3"
          aria-label="Sections des paramètres"
        >
          {sections.map(
            ({ name, description: itemDescription, icon: ItemIcon }) => (
              <button
                key={name}
                onClick={() => setSection(name)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${section === name ? "bg-[#e5f1ec] text-[#1D7159]" : "text-[#60766c] hover:bg-[#f7faf8]"}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf7f2]">
                  <ItemIcon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{name}</span>
                  <span className="mt-0.5 block text-xs opacity-70">
                    {itemDescription}
                  </span>
                </span>
              </button>
            )
          )}
        </nav>
        <section className="rounded-2xl border border-[#e4ebe7] bg-white p-6">
          <div className="flex items-start gap-4 border-b border-[#edf1ef] pb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f3ee] text-[#1D7159]">
              <ActiveIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#29463b]">
                {active.title}
              </h2>
              <p className="mt-1 text-sm text-[#81928a]">
                {active.description}
              </p>
            </div>
          </div>
          {section === "Bannières" ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-sm font-semibold text-[#486057]">Numéro<input type="number" min="1" max="9999" value={bannerNumber} onChange={event => setBannerNumber(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-[#dce8e2] px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-[#486057] md:col-span-2">Titre<input value={bannerTitle} onChange={event => setBannerTitle(event.target.value)} maxLength={120} placeholder="Ex. Offre rentrée" className="mt-2 h-10 w-full rounded-xl border border-[#dce8e2] px-3 font-normal" /></label>
              </div>
              <label className="block rounded-xl border border-dashed border-[#b9d7ca] bg-[#f7faf8] p-5 text-sm font-semibold text-[#486057]">Image de bannière<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => handleBannerFile(event.target.files?.[0])} className="mt-3 block w-full text-sm font-normal text-[#60766c]" />{bannerFile ? <span className="mt-2 block text-xs font-normal text-[#1D7159]">Fichier sélectionné : {bannerFile.name}</span> : <span className="mt-2 block text-xs font-normal text-[#81928a]">JPG, PNG ou WebP · 5 Mo maximum</span>}</label>
              <Button disabled={!bannerFile || !bannerTitle.trim() || uploadBanner.isPending} onClick={() => bannerFile && uploadBanner.mutate({ bannerNumber: Number(bannerNumber), title: bannerTitle.trim(), contentType: bannerFile.contentType, dataBase64: bannerFile.dataBase64 })} className="rounded-xl bg-[#1D7159] text-white hover:bg-[#165b47]">{uploadBanner.isPending ? "Upload en cours…" : "Enregistrer la bannière"}</Button>
              <div><h3 className="font-semibold text-[#29463b]">Bannières enregistrées</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{bannersQuery.isLoading ? <p className="text-sm text-[#81928a]">Chargement…</p> : bannersQuery.data?.length ? bannersQuery.data.map(banner => <div key={banner.id} className="overflow-hidden rounded-xl border border-[#e4ebe7] bg-white"><img src={banner.image_url} alt={banner.title} className="h-28 w-full object-cover" /><div className="p-3"><p className="text-sm font-semibold text-[#29463b]">#{banner.banner_number} · {banner.title}</p><p className="mt-1 text-xs text-[#81928a]">Statut : {banner.status}</p><select aria-label={`Statut de la bannière ${banner.banner_number}`} value={banner.status} onChange={event => updateBannerStatus.mutate({ id: banner.id, status: event.target.value as BannerStatus })} className="mt-3 h-9 w-full rounded-lg border border-[#dce8e2] px-2 text-xs text-[#486057]">{BANNER_STATUSES.map(status => <option key={status} value={status}>{bannerStatusLabel(status)}</option>)}</select></div></div>) : <p className="rounded-xl bg-[#f7faf8] p-4 text-sm text-[#81928a]">Aucune bannière réelle enregistrée.</p>}</div></div>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {active.fields.map(field => (
                  <div key={field} className="rounded-xl border border-[#e5ede8] bg-[#fbfdfc] p-4"><p className="text-sm font-semibold text-[#486057]">{field.split(" · ")[0]}</p><p className="mt-2 text-sm text-[#1D7159]">{field.split(" · ")[1]}</p></div>
                ))}
              </div>
              <div className="mt-6 rounded-xl bg-[#f7faf8] p-4 text-sm text-[#60766c]">Les valeurs affichées sont prêtes à être reliées aux paramètres persistants du serveur.</div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const certificationRequests: Row[] = [];

const subscriptionRows: Row[] = [];

function CertificationPage() {
  const [selected, setSelected] = useState<Row | null>(null);
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const certificationQuery = trpc.admin.certifications.useQuery();
  const authorize = trpc.admin.authorizeSensitiveAction.useMutation({
    onError: () => toast.error("Action refusée : accès administrateur requis"),
  });
  const decideCertification = trpc.admin.decideCertification.useMutation({
    onError: () => toast.error("La décision n’a pas pu être enregistrée"),
  });
  const rows = useMemo<Row[]>(
    () =>
      (certificationQuery.data ?? []).map(item => {
        const status = String(item.status).toLowerCase();
        const approved = ["approved", "certified", "accepted"].includes(status);
        const rejected = ["rejected", "refused"].includes(status);
        return {
          id: `CERT-${item.id}`,
          name: `Demande #${item.id}`,
          meta: `Utilisateur ${item.user_id}`,
          status: approved ? "Certifié" : rejected ? "Refusée" : "À examiner",
          statusTone: approved ? "green" : rejected ? "red" : "gold",
          extra:
            Array.isArray(item.document_urls) && item.document_urls.length
              ? `${item.document_urls.length} document(s) réel(s)`
              : "Aucun document réel référencé",
          icon: BadgeCheck,
        };
      }),
    [certificationQuery.data]
  );
  const empty = rows.length === 0;
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Vérification professionnelle"
        title="Demandes de certification"
        description="Les demandes affichées proviennent exclusivement de certification_requests."
        action={
          <ExportButton filename="wapigarage-certifications.csv" rows={rows} />
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="À examiner"
          value={String(rows.filter(r => r.status === "À examiner").length)}
          change="Supabase"
          icon={BadgeCheck}
          tone="gold"
        />
        <KpiCard
          label="Refusées"
          value={String(rows.filter(r => r.status === "Refusée").length)}
          change="Supabase"
          icon={FileText}
          tone="red"
        />
        <KpiCard
          label="Certifiées"
          value={String(rows.filter(r => r.status === "Certifié").length)}
          change="Supabase"
          icon={ShieldCheck}
        />
      </div>
      <div className="mt-6 rounded-2xl border border-[#e4ebe7] bg-white p-5">
        {empty ? (
          <p className="rounded-xl bg-[#f7faf8] p-5 text-sm text-[#81928a]">
            Aucune demande de certification réelle disponible.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map(request => (
              <div
                key={request.id}
                className="flex flex-col gap-3 rounded-xl border border-[#edf1ef] p-4 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#29463b]">{request.name}</p>
                  <p className="text-sm text-[#81928a]">{request.meta}</p>
                  <p className="text-xs text-[#8a9d94]">{request.extra}</p>
                </div>
                <StatusBadge tone={request.statusTone}>
                  {request.status}
                </StatusBadge>
                <Button
                  variant="outline"
                  className="rounded-xl border-[#dce8e2] text-[#1D7159]"
                  onClick={() => setSelected(request)}
                >
                  Voir les données
                </Button>
                {request.status === "À examiner" ? (
                  <>
                    <Button
                      className="rounded-xl bg-[#1D7159] text-white"
                      onClick={() => {
                        setSelected(request);
                        setPending("approve");
                      }}
                    >
                      Approuver
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl border-[#e7d5d2] text-[#b33a30]"
                      onClick={() => {
                        setSelected(request);
                        setPending("reject");
                      }}
                    >
                      Refuser
                    </Button>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog
        open={selected !== null && pending === null}
        onOpenChange={open => !open && setSelected(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Données de {selected?.name}</DialogTitle>
            <DialogDescription>{selected?.meta}</DialogDescription>
          </DialogHeader>
          <p className="rounded-xl bg-[#f7faf8] p-4 text-sm text-[#486057]">
            {selected?.extra}
          </p>
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog
        open={pending !== null}
        title={
          pending === "approve"
            ? "Confirmer la certification"
            : "Confirmer le refus"
        }
        description="Cette décision sera enregistrée dans Supabase."
        confirmLabel={pending === "approve" ? "Accorder" : "Refuser"}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!selected || !pending) return;
          authorize.mutate(
            {
              action:
                pending === "approve"
                  ? "certification_approve"
                  : "certification_reject",
            },
            {
              onSuccess: () =>
                decideCertification.mutate(
                  {
                    id: selected.id.replace(/^CERT-/, ""),
                    decision: pending === "approve" ? "approved" : "rejected",
                  },
                  {
                    onSuccess: () => {
                      toast.success("Décision enregistrée");
                      setPending(null);
                      setSelected(null);
                    },
                  }
                ),
            }
          );
        }}
      />
    </div>
  );
}

function SubscriptionsPage() {
  const subscriptionsQuery = trpc.admin.subscriptions.useQuery();
  const utils = trpc.useUtils();
  const [pendingSubscription, setPendingSubscription] = useState<{ id: string; name: string; status: SubscriptionStatus } | null>(null);
  const updateSubscriptionStatus = trpc.admin.updateSubscriptionStatus.useMutation({
    onSuccess: async () => {
      toast.success("Statut d’abonnement enregistré dans Supabase");
      setPendingSubscription(null);
      await utils.admin.subscriptions.invalidate();
      await utils.admin.auditLogs.invalidate();
    },
    onError: error => toast.error(error.message || "Le statut n’a pas pu être enregistré"),
  });
  const subscriptions = subscriptionsQuery.data ?? [];
  const active = subscriptions.filter(item =>
    ["active", "trialing"].includes(String(item.status))
  ).length;
  const overdue = subscriptions.filter(item =>
    ["past_due", "expired"].includes(String(item.status))
  ).length;
  const monthlyRevenue = subscriptions
    .filter(item => ["active", "trialing"].includes(String(item.status)))
    .reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const rows = subscriptions.map(item => ({
    id: String(item.id),
    name: item.garage_name
      ? String(item.garage_name)
      : `Garage #${item.garage_id}`,
    meta: `${item.plan} · ${item.currency}`,
    status: String(item.status),
    statusTone: ["active", "trialing"].includes(String(item.status))
      ? ("green" as const)
      : ["past_due", "expired"].includes(String(item.status))
        ? ("red" as const)
        : ("gold" as const),
    amount: `${Number(item.amount ?? 0).toLocaleString("fr-FR")} ${item.currency}`,
    extra: item.current_period_end
      ? `Échéance ${new Date(item.current_period_end).toLocaleDateString("fr-FR")}`
      : "Échéance non renseignée",
    icon: CreditCard,
  }));
  const paidRows = rows.filter(row => ["active", "trialing"].includes(row.status));
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Revenus récurrents"
        title="Gestion des abonnements"
        description="Les abonnements affichés proviennent exclusivement de Supabase."
        action={
          <ExportButton filename="wapigarage-abonnements.csv" rows={rows} />
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Abonnements actifs"
          value={String(active)}
          change="Supabase"
          icon={CreditCard}
        />
        <KpiCard
          label="Paiements en retard"
          value={String(overdue)}
          change="Supabase"
          icon={CircleAlert}
          tone="red"
        />
        <KpiCard
          label="Revenu actif"
          value={`${monthlyRevenue.toLocaleString("fr-FR")} FCFA`}
          change="Calculé sur les abonnements réels"
          icon={WalletCards}
          tone="gold"
        />
      </div>
      <div className="mt-6 rounded-2xl border border-[#e4ebe7] bg-white p-5">
        {subscriptionsQuery.isLoading ? (
          <p className="rounded-xl bg-[#f7faf8] p-5 text-sm text-[#81928a]">
            Chargement des abonnements…
          </p>
        ) : rows.length ? (
          <div className="space-y-3">
            {rows.map(row => (
              <div
                key={row.id}
                className="flex flex-col gap-3 rounded-xl border border-[#edf1ef] p-4 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#29463b]">{row.name}</p>
                  <p className="text-sm text-[#81928a]">{row.meta}</p>
                  <p className="text-xs text-[#8a9d94]">{row.extra}</p>
                </div>
                <StatusBadge tone={row.statusTone}>{row.status}</StatusBadge>
                <span className="text-sm font-semibold text-[#29463b]">
                  {row.amount}
                </span>
                <select
                  aria-label={`Modifier le statut de ${row.name}`}
                  value={row.status}
                  disabled={updateSubscriptionStatus.isPending}
                  onClick={event => event.stopPropagation()}
                  onChange={event => {
                    const nextStatus = event.target.value as SubscriptionStatus;
                    setPendingSubscription({ id: row.id, name: row.name, status: nextStatus });
                  }}
                  className="h-9 rounded-lg border border-[#dce8e2] bg-white px-2 text-xs text-[#486057]"
                >
                  <option value="active">Actif</option>
                  <option value="trialing">Essai</option>
                  <option value="past_due">En retard</option>
                  <option value="expired">Expiré</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-[#f7faf8] p-5 text-sm text-[#81928a]">
            Aucun abonnement réel disponible.
          </p>
        )}
      </div>
      <section className="mt-6 rounded-2xl border border-[#e4ebe7] bg-white p-5">
        <h2 className="font-semibold text-[#29463b]">Garages ayant payé</h2>
        <p className="mt-1 text-xs text-[#8a9d94]">Garages avec un abonnement actif ou en période d’essai réel.</p>
        {paidRows.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paidRows.map(row => (
              <div key={`paid-${row.id}`} className="rounded-xl bg-[#e8f3ee] p-4">
                <p className="font-semibold text-[#1D7159]">{row.name}</p>
                <p className="mt-1 text-xs text-[#6f857b]">{row.amount} · {row.meta}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-[#f7faf8] p-4 text-sm text-[#81928a]">Aucun garage payeur réel disponible.</p>
        )}
      </section>
      <ConfirmActionDialog
        open={pendingSubscription !== null}
        title="Confirmer le changement d’abonnement"
        description={pendingSubscription ? `Le statut de ${pendingSubscription.name} sera modifié dans Supabase et l’action sera journalisée.` : ""}
        confirmLabel="Enregistrer le statut"
        destructive={false}
        onCancel={() => setPendingSubscription(null)}
        onConfirm={() => {
          if (!pendingSubscription) return;
          updateSubscriptionStatus.mutate({ id: pendingSubscription.id, status: pendingSubscription.status });
        }}
      />
    </div>
  );
}

function SecurityPage() {
  const auditQuery = trpc.admin.auditLogs.useQuery();
  const logs = auditQuery.data ?? [];
  const rows = logs.map(log => ({
    id: String(log.id),
    name: String(log.action),
    meta: `${log.resource_type}${log.resource_id ? ` · ${log.resource_id}` : ""}`,
    status: "Journalisé",
    statusTone: "green" as const,
    extra: `${log.admin_user_id} · ${new Date(log.created_at).toLocaleString("fr-FR")}`,
    icon: ShieldCheck,
  }));
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Protection administrateur"
        title="Sécurité et audit"
        description="Les actions affichées proviennent exclusivement du journal Supabase."
        action={
          <ExportButton
            filename="wapigarage-journal-securite.csv"
            rows={rows}
          />
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Sessions actives"
          value="—"
          change="Donnée non exposée"
          icon={LockKeyhole}
        />
        <KpiCard
          label="MFA administrateur"
          value="Activée"
          change="Connexion protégée"
          icon={ShieldCheck}
        />
        <KpiCard
          label="Actions sensibles"
          value={String(logs.length)}
          change="Journal Supabase"
          icon={Activity}
        />
      </div>
      <div className="mt-6 rounded-2xl border border-[#e4ebe7] bg-white p-5">
        {auditQuery.isLoading ? (
          <p className="rounded-xl bg-[#f7faf8] p-5 text-sm text-[#81928a]">
            Chargement du journal…
          </p>
        ) : rows.length ? (
          <div className="space-y-3">
            {rows.map(row => (
              <div
                key={row.id}
                className="rounded-xl border border-[#edf1ef] p-4"
              >
                <p className="font-semibold text-[#29463b]">{row.name}</p>
                <p className="mt-1 text-sm text-[#81928a]">{row.meta}</p>
                <p className="mt-1 text-xs text-[#8a9d94]">{row.extra}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-[#f7faf8] p-5 text-sm text-[#81928a]">
            Aucune action d’audit réelle disponible.
          </p>
        )}
      </div>
    </div>
  );
}

function UtilityPage({ path }: { path: string }) {
  const titles: Record<string, string> = {
    "/activity": "Activité",
    "/messages": "Messages et support",
    "/notifications": "Notifications",
    "/security": "Sécurité et audit",
    "/settings": "Paramètres",
  };
  const descriptions: Record<string, string> = {
    "/activity": "Aucune table d’activité réelle n’est encore reliée.",
    "/messages": "Consulte les messages réels depuis la page dédiée.",
    "/notifications":
      "Les notifications réelles seront affichées après connexion de leur flux.",
    "/security":
      "Le journal réel sera affiché après création de la table d’audit.",
    "/settings":
      "Les paramètres persistants ne sont pas encore exposés par Supabase.",
  };
  const title = titles[path] ?? "Administration";
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Administration"
        title={title}
        description={descriptions[path] ?? "Aucune donnée réelle disponible."}
        action={
          <Button
            variant="outline"
            className="h-10 rounded-xl border-[#dce8e2] text-[#1D7159]"
            disabled
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Aucune donnée
          </Button>
        }
      />
      <div className="rounded-2xl border border-[#e4ebe7] bg-white p-8 text-center">
        <p className="text-sm font-semibold text-[#486057]">
          Aucune donnée réelle disponible
        </p>
        <p className="mt-2 text-sm text-[#81928a]">
          Cette section sera activée lorsqu’une table ou une procédure Supabase
          correspondante sera disponible.
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [location] = useLocation();
  const detail = location.match(
    /^\/(garages|users|payments|invoices)\/([^/]+)/
  );
  let content: React.ReactNode;
  if (detail)
    content =
      detail[1] === "users" ? (
        <UserDetailPage id={detail[2]} />
      ) : (
        <DetailPage
          type={
            detail[1] === "garages"
              ? "garage"
              : detail[1] === "payments"
                ? "payment"
                : "invoice"
          }
          id={detail[2]}
        />
      );
  else if (location === "/") content = <HomeDashboard />;
  else if (location === "/garages")
    content = (
      <ListPage
        type="garage"
        title="Garages"
        description="Valide, surveille et accompagne les garages présents sur WapiGarage."
        rows={garages}
      />
    );
  else if (location === "/users")
    content = (
      <ListPage
        type="user"
        title="Utilisateurs"
        description="Gère les comptes clients, propriétaires et administrateurs de la plateforme."
        rows={users}
      />
    );
  else if (location === "/payments")
    content = (
      <ListPage
        type="payment"
        title="Paiements"
        description="Contrôle les transactions et vérifie que chaque montant vient de la facture serveur."
        rows={payments}
      />
    );
  else if (location === "/invoices")
    content = (
      <ListPage
        type="invoice"
        title="Factures"
        description="Retrouve les factures, leurs statuts et les paiements associés."
        rows={invoices}
      />
    );
  else if (location === "/reviews") content = <ReviewModerationPage />;
  else if (location === "/messages") content = <SupportPage />;
  else if (location === "/certifications") content = <CertificationPage />;
  else if (location === "/subscriptions") content = <SubscriptionsPage />;
  else if (location === "/security") content = <SecurityPage />;
  else if (location === "/reports") content = <ReportsPage />;
  else content = <UtilityPage path={location} />;
  return <DashboardLayout>{content}</DashboardLayout>;
}
