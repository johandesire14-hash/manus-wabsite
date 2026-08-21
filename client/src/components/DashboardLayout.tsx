import {
  Activity,
  Bell,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MoreHorizontal,
  CircleHelp,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  BadgeCheck,
  CreditCard,
  Star,
  Users,
  WalletCards,
} from "lucide-react";
import React from "react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { hasAdminAccess } from "@/lib/adminSecurityContracts";
import { AdminAccessGate } from "@/components/AdminAccessGate";
import { useEffect, useState } from "react";

const guideContent: Record<string, { summary: string; points: string[] }> = {
  Accueil: { summary: "L’accueil rassemble les indicateurs Supabase, l’historique KPay et la répartition des garages par ville.", points: ["Les KPI sont calculés sur les données réelles.", "L’historique affiche les cinq dernières transactions chargées.", "La répartition géographique utilise les adresses et quartiers renseignés."] },
  Activité: { summary: "Cette page présente les événements administratifs lorsqu’un flux d’activité réel est disponible.", points: ["Un état vide signifie qu’aucune table d’activité n’est reliée.", "Ne pas interpréter l’absence d’événement comme une absence d’activité de la plateforme.", "Utiliser Sécurité et audit pour les actions administrateur journalisées."] },
  Garages: { summary: "La liste permet de rechercher un garage, filtrer son statut et ouvrir sa fiche détaillée.", points: ["Le bouton d’export produit uniquement les lignes Supabase chargées.", "Ouvrez un garage pour consulter son propriétaire et ses coordonnées.", "Toute suspension ou suppression doit être confirmée."] },
  Utilisateurs: { summary: "La page rassemble les comptes clients, professionnels et administrateurs présents dans Supabase.", points: ["La recherche porte sur le nom, l’e-mail, le téléphone et le type de compte.", "La fiche utilisateur affiche ses avis et son garage professionnel lié.", "Les actions sensibles sont réservées au rôle administrateur."] },
  Paiements: { summary: "Cette page permet de contrôler les transactions KPay et leurs statuts réels.", points: ["Le montant affiché vient de kpay_payments et non du client.", "Ouvrez une transaction pour consulter sa référence et son fournisseur.", "Un statut pending ne doit pas être déclaré payé manuellement sans confirmation serveur."] },
  Factures: { summary: "La page permet de retrouver les factures, leur montant, leur garage et leur statut.", points: ["L’identifiant de facture reste la référence de recherche.", "Vérifiez le statut avant toute analyse de paiement.", "Les factures sans client associé affichent explicitement cette absence."] },
  "Avis et modération": { summary: "Cette page consulte les avis réels et centralise les actions de modération.", points: ["Un avis doit rester lié à un utilisateur, un garage et, si disponible, une facture.", "Ne supprimez pas un avis sans confirmation et justification.", "Les états Signalement, Publié et Masqué sont distincts."] },
  "Signalements et support": { summary: "Cette page rassemble les plaintes de bug, les suggestions d’amélioration et les conversations support réelles.", points: ["Lisez le contenu complet avant toute action sur un compte.", "Les plaintes et suggestions viennent de support_reports ; les échanges viennent de conversations et messages.", "Un état vide signifie qu’aucun signalement ou message réel n’a été renvoyé."] },
  "Demandes de certification": { summary: "Cette page examine les demandes professionnelles et leurs documents réels.", points: ["Ouvrez les données avant d’approuver ou de refuser.", "La décision est protégée par adminProcedure et persistée dans Supabase.", "Une demande sans document réel ne doit pas être considérée comme vérifiée."] },
  Abonnements: { summary: "Cette page affiche les abonnements, les garages payeurs, les échéances et les revenus actifs.", points: ["Les garages payeurs viennent des statuts active ou trialing.", "Le revenu actif est calculé sur les abonnements réels.", "L’historique complet des transactions reste consultable dans Paiements."] },
  Notifications: { summary: "Cette page consulte les notifications réelles destinées aux utilisateurs.", points: ["Vérifiez le type, la cible et la date avant analyse.", "Aucune notification ne doit être inventée pour remplir l’interface.", "Les notifications liées à un paiement doivent renvoyer à sa référence."] },
  "Sécurité et audit": { summary: "Cette page affiche les actions administrateur enregistrées dans admin_audit_logs.", points: ["Chaque ligne indique l’administrateur, l’action, la ressource et la date.", "Les sessions et secrets ne sont pas exposés dans l’interface.", "Utilisez cette page pour contrôler les décisions sensibles."] },
  Paramètres: { summary: "Cette page regroupe les paramètres de la plateforme et les intégrations lorsqu’elles sont exposées.", points: ["Les secrets restent côté serveur et ne doivent jamais apparaître ici.", "Toute modification de KPay, Infobip ou OAuth doit être testée séparément.", "Un paramètre non relié est affiché comme indisponible, jamais simulé."] },
};

const menuItems = [
  { icon: LayoutDashboard, label: "Accueil", path: "/" },
  { icon: Activity, label: "Activité", path: "/activity" },
  { icon: Building2, label: "Garages", path: "/garages" },
  { icon: Users, label: "Utilisateurs", path: "/users" },
  { icon: WalletCards, label: "Paiements", path: "/payments" },
  { icon: Receipt, label: "Factures", path: "/invoices" },
  { icon: Star, label: "Avis et modération", path: "/reviews" },
  { icon: MessageSquare, label: "Signalements et support", path: "/messages" },
  { icon: BadgeCheck, label: "Demandes de certification", path: "/certifications" },
  { icon: CreditCard, label: "Abonnements", path: "/subscriptions" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: ShieldCheck, label: "Sécurité et audit", path: "/security" },
  { icon: Settings, label: "Paramètres", path: "/settings" },
];

export function AdminNavigation({ location, onNavigate }: { location: string; onNavigate: (path: string) => void }) {
  return <SidebarMenu className="gap-1">
    {menuItems.map((item) => {
      const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
      return <SidebarMenuItem key={item.path}>
        <SidebarMenuButton isActive={isActive} onClick={() => onNavigate(item.path)} tooltip={item.label} className={`h-10 rounded-xl px-3 text-sm font-medium transition-colors ${isActive ? "bg-[#e5f1ec] text-[#1D7159] hover:bg-[#e5f1ec]" : "text-[#61766d] hover:bg-[#f2f6f4] hover:text-[#1D7159]"}`}>
          <item.icon className="h-[18px] w-[18px]" />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>;
    })}
  </SidebarMenu>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(272);
  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const [location, setLocation] = useLocation();
  const { user, logout, loading } = useAuth();
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const currentName = user?.name || "Connexion administrateur requise";
  const currentEmail = user?.email || "Aucune session active";
  const adminAccess = hasAdminAccess(user as { role?: string } | null);
  const active = menuItems.find(item => item.path === location) ?? menuItems[0];
  const currentGuide = guideContent[active.label] ?? guideContent.Accueil;

  useEffect(() => {
    document.title = `${active.label} · WapiGarage Admin`;
  }, [active.label]);

  useEffect(() => {
    if (!loading && !adminAccess && location !== "/login") {
      setLocation("/login");
    }
  }, [adminAccess, loading, location, setLocation]);

  const goToSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (search.trim()) setLocation(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-[#dfe7e3] bg-white">
        <SidebarHeader className="h-[76px] border-b border-[#edf1ef] px-4">
          <div className="flex items-center gap-3 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1D7159] text-lg font-bold text-white shadow-sm">W</div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold text-[#163c31]">WapiGarage</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#7b9188]">Administration</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8ba097] group-data-[collapsible=icon]:hidden">Navigation</p>
          <AdminNavigation location={location} onNavigate={setLocation} />
        </SidebarContent>

        <SidebarFooter className="border-t border-[#edf1ef] p-3">
          <div className="flex items-center gap-3 rounded-xl p-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9 border border-[#d8e6df] bg-[#e5f1ec]"><AvatarFallback className="bg-[#e5f1ec] text-xs font-bold text-[#1D7159]">{user ? currentName.charAt(0) : "·"}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-semibold text-[#233b33]">{currentName}</p><p className="truncate text-[11px] text-[#81928b]">{currentEmail}</p></div>
            {user ? <Button variant="ghost" size="icon" className="h-8 w-8 group-data-[collapsible=icon]:hidden" onClick={logout} aria-label="Se déconnecter"><LogOut className="h-4 w-4 text-[#81928b]" /></Button> : null}
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0 bg-[#F2F3F5]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e5ebe8] bg-white/95 px-5 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3"><SidebarTrigger className="h-9 w-9 rounded-xl text-[#61766d]" /><div className="hidden items-center gap-2 text-sm text-[#8a9b94] md:flex"><span>Administration</span><ChevronRight className="h-3.5 w-3.5" /><span className="font-semibold text-[#243c33]">{active.label}</span></div><span className="truncate text-sm font-semibold text-[#243c33] md:hidden">{active.label}</span></div>
          <div className="flex items-center gap-2 md:gap-4">
            <form onSubmit={goToSearch} className="relative hidden md:block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aaba4]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher..." className="h-9 w-56 rounded-xl border-[#e2ebe6] bg-[#f7faf8] pl-9 text-sm focus-visible:ring-[#1D7159]" /></form>
            <button onClick={() => setLocation("/notifications")} className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#61766d] transition hover:bg-[#f1f6f3]" aria-label="Ouvrir les notifications"><Bell className="h-[18px] w-[18px]" /></button>
            <button onClick={() => setGuideOpen(current => !current)} className="flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#61766d] transition hover:bg-[#f1f6f3]" aria-expanded={guideOpen} aria-label="Afficher le guide de la page"><CircleHelp className="h-[18px] w-[18px]" /><span className="hidden md:inline">Aide</span></button><div className="hidden h-7 w-px bg-[#e5ebe8] sm:block" /><div className="flex items-center gap-2"><Avatar className="h-8 w-8 border border-[#d8e6df]"><AvatarFallback className="bg-[#e5f1ec] text-xs font-bold text-[#1D7159]">{user ? currentName.charAt(0) : "·"}</AvatarFallback></Avatar><span className="hidden max-w-28 truncate text-sm font-semibold text-[#344b42] lg:block">{currentName}</span></div>
          </div>
        </header>
                {guideOpen ? <aside className="absolute right-5 top-[86px] z-40 w-[min(390px,calc(100vw-2rem))] rounded-2xl border border-[#dce8e2] bg-white p-5 shadow-[0_18px_45px_rgba(29,113,89,0.16)]"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1D7159]">Guide de la page</p><h2 className="mt-1 text-lg font-bold text-[#29463b]">{active.label}</h2></div><button onClick={() => setGuideOpen(false)} className="text-sm text-[#81928a]" aria-label="Fermer le guide">Fermer</button></div><p className="mt-4 text-sm leading-6 text-[#61766d]">{currentGuide.summary}</p><div className="mt-4 space-y-2">{currentGuide.points.map(point => <p key={point} className="rounded-xl bg-[#f7faf8] p-3 text-xs leading-5 text-[#71847b]">{point}</p>)}</div><p className="mt-4 text-xs leading-5 text-[#71847b]"><strong className="text-[#29463b]">Règle générale :</strong> les données absentes restent affichées comme indisponibles et ne sont jamais remplacées par des exemples fictifs.</p></aside> : null}
<main className="min-h-[calc(100vh-76px)] p-4 md:p-8">{loading ? <div className="flex min-h-[60vh] items-center justify-center text-sm text-[#7c9187]">Chargement du compte administrateur…</div> : !adminAccess ? <div className="flex min-h-[60vh] items-center justify-center text-sm text-[#7c9187]">Redirection vers la connexion…</div> : children}</main>
      </SidebarInset>
    </>
  );
}
