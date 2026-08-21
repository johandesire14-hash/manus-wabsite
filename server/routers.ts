import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "./supabase";
import { storagePut } from "./storage";

async function writeAdminAudit(input: { adminUserId: string | number; action: string; resourceType: string; resourceId?: string | number; metadata?: Record<string, unknown> }) {
  const { error } = await supabaseAdmin.from("admin_audit_logs").insert({
    admin_user_id: String(input.adminUserId),
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId == null ? null : String(input.resourceId),
    metadata: input.metadata ?? {},
  });
  if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible d’enregistrer l’action dans le journal d’audit" });
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  admin: router({
    overview: adminProcedure.query(async () => {
      const [users, garages, invoices, payments, reviews] = await Promise.all([
        supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("garages").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("invoices").select("id,status", { count: "exact" }).limit(500),
        supabaseAdmin.from("kpay_payments").select("amount,status").limit(500),
        supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }),
      ]);
      if (users.error || garages.error || invoices.error || payments.error || reviews.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les indicateurs Supabase" });
      const invoiceRows = invoices.data ?? [];
      const paymentRows = payments.data ?? [];
      return {
        users: users.count ?? 0,
        garages: garages.count ?? 0,
        pendingInvoices: invoiceRows.filter((invoice) => ["pending", "issued"].includes(String(invoice.status))).length,
        reviews: reviews.count ?? 0,
        paymentTotal: paymentRows.reduce((total, payment) => total + Number(payment.amount ?? 0), 0),
        paymentCount: paymentRows.length,
      };
    }),
    finance: adminProcedure.query(async () => {
      const [settingsResult, entriesResult, paymentsResult, subscriptionsResult] = await Promise.all([
        supabaseAdmin.from("finance_settings").select("id,commission_rate,currency,updated_by,updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabaseAdmin.from("finance_entries").select("id,entry_type,category,amount,currency,occurred_at,notes,created_by,created_at").order("occurred_at", { ascending: false }).limit(500),
        supabaseAdmin.from("kpay_payments").select("amount,gross_amount,commission_amount,net_amount,status,currency").limit(500),
        supabaseAdmin.from("subscriptions").select("amount,status,currency").limit(500),
      ]);
      if (settingsResult.error || entriesResult.error || paymentsResult.error || subscriptionsResult.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les données financières Supabase" });
      const settings = settingsResult.data;
      const entries = entriesResult.data ?? [];
      const paidStatuses = new Set(["paid", "success", "succeeded", "completed", "confirmed"]);
      const paidPayments = (paymentsResult.data ?? []).filter(payment => paidStatuses.has(String(payment.status).toLowerCase()));
      const paymentRevenue = paidPayments.reduce((total, payment) => total + Number(payment.net_amount ?? payment.amount ?? 0), 0);
      const commissionKnown = paidPayments.length === 0 || paidPayments.every(payment => payment.commission_amount != null) || settings?.commission_rate != null;
      const commissionRevenue = paidPayments.reduce((total, payment) => total + Number(payment.commission_amount ?? (settings?.commission_rate != null ? Number(payment.gross_amount ?? payment.amount ?? 0) * Number(settings.commission_rate) / 100 : 0)), 0);
      const subscriptionRevenue = (subscriptionsResult.data ?? []).filter(subscription => ["active", "trialing"].includes(String(subscription.status).toLowerCase())).reduce((total, subscription) => total + Number(subscription.amount ?? 0), 0);
      const advertisingRevenue = entries.filter(entry => entry.entry_type === "advertising_revenue").reduce((total, entry) => total + Number(entry.amount ?? 0), 0);
      const expenses = entries.filter(entry => entry.entry_type === "expense").reduce((total, entry) => total + Number(entry.amount ?? 0), 0);
      const expensesKnown = entries.some(entry => entry.entry_type === "expense");
      const grossRevenue = paymentRevenue + subscriptionRevenue + advertisingRevenue;
      return { settings, entries, paymentRevenue, commissionRevenue, commissionKnown, subscriptionRevenue, advertisingRevenue, expenses, expensesKnown, grossRevenue, netProfit: expensesKnown ? grossRevenue - expenses : null };
    }),
    updateFinanceSettings: adminProcedure.input(z.object({ commissionRate: z.number().min(0).max(100), currency: z.string().trim().length(3) })).mutation(async ({ input, ctx }) => {
      const { data, error } = await supabaseAdmin.from("finance_settings").insert({ commission_rate: input.commissionRate, currency: input.currency.toUpperCase(), updated_by: ctx.user.id, updated_at: new Date().toISOString() }).select("id,commission_rate,currency,updated_by,updated_at").single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible d’enregistrer les paramètres financiers" });
      await writeAdminAudit({ adminUserId: ctx.user.id, action: "finance_settings_update", resourceType: "finance_settings", resourceId: data?.id, metadata: { commissionRate: input.commissionRate, currency: input.currency.toUpperCase() } });
      return data;
    }),
    addFinanceEntry: adminProcedure.input(z.object({ entryType: z.enum(["advertising_revenue", "expense"]), category: z.string().trim().min(1).max(80), amount: z.number().min(0), currency: z.string().trim().length(3), occurredAt: z.string().datetime(), notes: z.string().trim().max(500).optional() })).mutation(async ({ input, ctx }) => {
      const { data, error } = await supabaseAdmin.from("finance_entries").insert({ entry_type: input.entryType, category: input.category, amount: input.amount, currency: input.currency.toUpperCase(), occurred_at: input.occurredAt, notes: input.notes || null, created_by: ctx.user.id }).select("id,entry_type,category,amount,currency,occurred_at,notes,created_by,created_at").single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible d’enregistrer l’écriture financière" });
      await writeAdminAudit({ adminUserId: ctx.user.id, action: "finance_entry_create", resourceType: "finance_entry", resourceId: data?.id, metadata: { entryType: input.entryType, category: input.category, amount: input.amount, currency: input.currency.toUpperCase() } });
      return data;
    }),
    garages: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("garages").select("id,owner_id,name,neighborhood,address,phone,whatsapp,certified").order("created_at", { ascending: false }).limit(100);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les garages Supabase" });
      return data ?? [];
    }),
    users: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("users").select("id,email,first_name,last_name,profile_image_url,phone,account_type,created_at,onboarding_completed").order("created_at", { ascending: false }).limit(100);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les utilisateurs Supabase" });
      return data ?? [];
    }),
    userDetail: adminProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
      const [userResult, reviewsResult, garagesResult, paymentsResult] = await Promise.all([
        supabaseAdmin.from("users").select("id,email,first_name,last_name,profile_image_url,phone,account_type,created_at,onboarding_completed").eq("id", input.id).maybeSingle(),
        supabaseAdmin.from("reviews").select("id,garage_id,rating,comment,created_at,invoice_id").eq("user_id", input.id).order("created_at", { ascending: false }),
        supabaseAdmin.from("garages").select("id,name,neighborhood,address,phone,certified").eq("owner_id", input.id).maybeSingle(),
        supabaseAdmin.from("kpay_payments").select("id", { count: "exact", head: true }).eq("client_id", input.id),
      ]);
      if (userResult.error || reviewsResult.error || garagesResult.error || paymentsResult.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger le détail utilisateur Supabase" });
      if (!userResult.data) return null;
      return { user: userResult.data, reviews: reviewsResult.data ?? [], professionalGarage: garagesResult.data, paymentCount: paymentsResult.count ?? 0 };
    }),
    invoices: adminProcedure.query(async () => {
      const [{ data, error }, paymentsResult] = await Promise.all([
        supabaseAdmin.from("invoices").select("id,garage_id,client_id,amount,currency,description,status,expires_at,paid_at,kpay_transaction_id,created_at").order("created_at", { ascending: false }).limit(100),
        supabaseAdmin.from("kpay_payments").select("id,invoice_id,external_id,garage_id,client_id,amount,status,description,transaction_id,phone_number,provider,created_at").order("created_at", { ascending: false }).limit(100),
      ]);
      if (error || paymentsResult.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les factures et paiements liés" });
      const rows = data ?? [];
      const existingIds = new Set(rows.map(row => String(row.id)));
      const linkedPaymentViews = (paymentsResult.data ?? [])
        .map(payment => ({ ...payment, reference: payment.invoice_id ?? payment.external_id }))
        .filter(payment => payment.reference && !existingIds.has(String(payment.reference)))
        .map(payment => ({
          id: String(payment.reference),
          garage_id: payment.garage_id,
          client_id: payment.client_id,
          amount: payment.amount,
          currency: "XAF",
          description: payment.description ?? "Facture liée à une transaction réelle",
          status: payment.status === "paid" || payment.status === "success" || payment.status === "confirmed" ? "paid" : payment.status,
          expires_at: null,
          paid_at: null,
          kpay_transaction_id: payment.transaction_id,
          created_at: payment.created_at,
          source: "payment_link" as const,
        }));
      const allRows = [...rows, ...linkedPaymentViews];
      const clientIds = allRows.map(row => row.client_id).filter((id): id is string => Boolean(id));
      const garageIds = allRows.map(row => row.garage_id).filter((id): id is number => typeof id === "number");
      const [clients, garages] = await Promise.all([
        clientIds.length ? supabaseAdmin.from("users").select("id,email,first_name,last_name,phone,account_type").in("id", clientIds) : Promise.resolve({ data: [], error: null }),
        garageIds.length ? supabaseAdmin.from("garages").select("id,name,owner_id,phone,neighborhood,address").in("id", garageIds) : Promise.resolve({ data: [], error: null }),
      ]);
      if (clients.error || garages.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les auteurs des factures" });
      const clientMap = new Map((clients.data ?? []).map(client => [client.id, client]));
      const garageMap = new Map((garages.data ?? []).map(garage => [garage.id, garage]));
      const paymentMap = new Map<string, (typeof paymentsResult.data)[number]>();
      for (const payment of paymentsResult.data ?? []) {
        for (const key of [payment.invoice_id, payment.external_id, payment.transaction_id]) {
          if (key) paymentMap.set(String(key), payment);
        }
      }
      return allRows.map(row => {
        const payment = paymentMap.get(String(row.id)) ?? paymentMap.get(String(row.kpay_transaction_id ?? "")) ?? null;
        return {
          ...row,
          client_author: row.client_id ? clientMap.get(row.client_id) ?? null : null,
          garage_author: garageMap.get(row.garage_id) ?? null,
          payer: payment ? { phone_number: payment.phone_number, provider: payment.provider, status: payment.status, external_id: payment.external_id, transaction_id: payment.transaction_id } : null,
        };
      });
    }),
    payments: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("kpay_payments").select("id,external_id,transaction_id,status,amount,provider,phone_number,description,client_id,garage_id,paid_at,gross_amount,commission_amount,net_amount,payout_status,invoice_id,created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les paiements Supabase" });
      return data ?? [];
    }),
    certifications: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("certification_requests").select("id,user_id,document_urls,status,created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les certifications Supabase" });
      return data ?? [];
    }),
    decideCertification: adminProcedure.input(z.object({ id: z.string().min(1), decision: z.enum(["approved", "rejected"]) })).mutation(async ({ input, ctx }) => {
      const { data, error } = await supabaseAdmin.from("certification_requests").update({ status: input.decision }).eq("id", input.id).select("id,status").maybeSingle();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible d’enregistrer la décision de certification" });
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de certification introuvable" });
      await writeAdminAudit({ adminUserId: ctx.user.id, action: `certification_${input.decision}`, resourceType: "certification_request", resourceId: input.id, metadata: { decision: input.decision } });
      return data;
    }),
    conversations: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("conversations").select("id,garage_id,client_id,last_message,last_message_at,client_unread_count,garage_unread_count,created_at").order("last_message_at", { ascending: false }).limit(100);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les conversations Supabase" });
      return data ?? [];
    }),
    messages: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("messages").select("id,conversation_id,sender_id,type,content,created_at,read_at").order("created_at", { ascending: false }).limit(300);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les messages Supabase" });
      return data ?? [];
    }),
    reviews: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("reviews").select("id,garage_id,user_id,rating,comment,quality_rating,honesty_rating,punctuality_rating,value_rating,created_at,invoice_id").order("created_at", { ascending: false }).limit(100);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les avis Supabase" });
      return data ?? [];
    }),
    supportReports: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("support_reports").select("*").order("id", { ascending: false }).limit(100);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les signalements Supabase" });
      return data ?? [];
    }),
    notifications: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("notifications").select("id,user_id,type,target,content,related_id,read,created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les notifications Supabase" });
      return data ?? [];
    }),
    subscriptions: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("subscriptions").select("id,garage_id,plan,status,amount,currency,started_at,current_period_end,cancelled_at,created_at,updated_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les abonnements Supabase" });
      const rows = data ?? [];
      const garageIds = rows.map((row) => row.garage_id).filter((id): id is number => typeof id === "number");
      if (!garageIds.length) return rows.map((row) => ({ ...row, garage_name: null }));
      const garages = await supabaseAdmin.from("garages").select("id,name").in("id", garageIds);
      if (garages.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les garages abonnés" });
      const names = new Map((garages.data ?? []).map((garage) => [garage.id, garage.name]));
      return rows.map((row) => ({ ...row, garage_name: names.get(row.garage_id) ?? null }));
    }),
    updateSubscriptionStatus: adminProcedure.input(z.object({ id: z.string().min(1), status: z.enum(["active", "trialing", "past_due", "expired", "cancelled"]) })).mutation(async ({ input, ctx }) => {
      const updates = { status: input.status, cancelled_at: input.status === "cancelled" ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
      const { data, error } = await supabaseAdmin.from("subscriptions").update(updates).eq("id", input.id).select("id,garage_id,plan,status,amount,currency,started_at,current_period_end,cancelled_at,created_at,updated_at").maybeSingle();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de modifier l’abonnement Supabase" });
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Abonnement introuvable" });
      await writeAdminAudit({ adminUserId: ctx.user.id, action: `subscription_status_${input.status}`, resourceType: "subscription", resourceId: input.id, metadata: { status: input.status, garageId: data.garage_id, plan: data.plan } });
      return data;
    }),
    banners: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("app_banners").select("id,banner_number,title,image_key,image_url,status,created_by,created_at,updated_at").order("banner_number", { ascending: true }).limit(100);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger les bannières Supabase" });
      return data ?? [];
    }),
    uploadBanner: adminProcedure.input(z.object({ bannerNumber: z.number().int().positive().max(9999), title: z.string().trim().min(1).max(120), contentType: z.enum(["image/jpeg", "image/png", "image/webp"]), dataBase64: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/).max(7_000_000) })).mutation(async ({ input, ctx }) => {
      const bytes = Buffer.from(input.dataBase64, "base64");
      if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Image vide ou supérieure à 5 Mo" });
      const extension = input.contentType.split("/")[1];
      const uploaded = await storagePut(`wapigarage/banners/banner-${input.bannerNumber}.${extension}`, bytes, input.contentType);
      const { data, error } = await supabaseAdmin.from("app_banners").upsert({ banner_number: input.bannerNumber, title: input.title, image_key: uploaded.key, image_url: uploaded.url, status: "draft", created_by: ctx.user.id, updated_at: new Date().toISOString() }, { onConflict: "banner_number" }).select("id,banner_number,title,image_key,image_url,status,created_by,created_at,updated_at").single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible d’enregistrer la bannière Supabase" });
      await writeAdminAudit({ adminUserId: ctx.user.id, action: "banner_upload", resourceType: "app_banner", resourceId: data?.id, metadata: { bannerNumber: input.bannerNumber, title: input.title, contentType: input.contentType } });
      return data;
    }),
    updateBannerStatus: adminProcedure.input(z.object({ id: z.string().uuid(), status: z.enum(["draft", "published", "archived"]) })).mutation(async ({ input, ctx }) => {
      const { data, error } = await supabaseAdmin.from("app_banners").update({ status: input.status, updated_at: new Date().toISOString() }).eq("id", input.id).select("id,banner_number,title,image_key,image_url,status,created_by,created_at,updated_at").single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de modifier le statut de la bannière" });
      await writeAdminAudit({ adminUserId: ctx.user.id, action: `banner_status_${input.status}`, resourceType: "app_banner", resourceId: input.id, metadata: { status: input.status } });
      return data;
    }),
    auditLogs: adminProcedure.query(async () => {
      const { data, error } = await supabaseAdmin.from("admin_audit_logs").select("id,admin_user_id,action,resource_type,resource_id,metadata,created_at").order("created_at", { ascending: false }).limit(200);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de charger le journal d’audit Supabase" });
      return data ?? [];
    }),
    authorizeSensitiveAction: adminProcedure.input(z.object({ action: z.enum(["certification_approve", "certification_reject", "subscription_change", "subscription_cancel", "subscription_suspend", "subscription_delete", "session_revoke"]) })).mutation(({ input, ctx }) => ({ allowed: true, action: input.action, adminId: ctx.user.id }))
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
