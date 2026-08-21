import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { getUserByOpenId, upsertUser } from "./db";
import { getAdminTotpUri, verifyAdminTotp } from "./totp";
import QRCode from "qrcode";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
  totp: z.string().regex(/^\d{6}$/).optional(),
});

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getAllowlistedEmails() {
  return (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
}

function secureEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getClientKey(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(forwardedValue?.split(",")[0]?.trim() || req.ip || "unknown");
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_ATTEMPTS;
}

export function registerAdminAuthRoute(app: Express) {
  app.post("/api/auth/admin/login", async (req: Request, res: Response) => {
    const clientKey = getClientKey(req);
    if (isRateLimited(clientKey)) {
      res.status(429).json({ error: "Trop de tentatives. Réessayez plus tard." });
      return;
    }

    const parsed = loginSchema.safeParse(req.body);
    const configuredPassword = process.env.ADMIN_PASSWORD ?? "";
    const email = parsed.success ? normalizeEmail(parsed.data.email) : "";
    const password = parsed.success ? parsed.data.password : "";
    const allowed = getAllowlistedEmails().includes(email);

    if (!parsed.success || !allowed || !configuredPassword || !secureEqual(password, configuredPassword)) {
      res.status(401).json({ error: "Adresse e-mail ou mot de passe incorrect." });
      return;
    }

    if (!parsed.data.totp) {
      res.status(428).json({ error: "Code Authenticator requis.", requiresTotp: true });
      return;
    }
    try {
      if (!verifyAdminTotp(parsed.data.totp)) {
        res.status(401).json({ error: "Code Authenticator incorrect." });
        return;
      }
    } catch {
      res.status(503).json({ error: "La 2FA n’est pas configurée côté serveur." });
      return;
    }

    const openId = `admin-email:${email}`;
    await upsertUser({
      openId,
      email,
      name: "Administrateur WapiGarage",
      loginMethod: "admin-password",
      role: "admin",
      lastSignedIn: new Date(),
    });

    const localUser = await getUserByOpenId(openId);
    if (!localUser || localUser.role !== "admin") {
      res.status(503).json({ error: "Le compte administrateur n’est pas disponible." });
      return;
    }

    const sessionToken = await sdk.createSessionToken(openId, {
      name: localUser.name ?? "Administrateur WapiGarage",
    });
    res.cookie(COOKIE_NAME, sessionToken, {
      ...getSessionCookieOptions(req),
      maxAge: 1000 * 60 * 60 * 12,
    });
    res.json({ success: true });
  });

  app.post("/api/auth/admin/totp/setup", async (req: Request, res: Response) => {
    const parsed = loginSchema.omit({ totp: true }).safeParse(req.body);
    const configuredPassword = process.env.ADMIN_PASSWORD ?? "";
    const email = parsed.success ? normalizeEmail(parsed.data.email) : "";
    const allowed = getAllowlistedEmails().includes(email);
    if (!parsed.success || !allowed || !configuredPassword || !secureEqual(parsed.data.password, configuredPassword)) {
      res.status(401).json({ error: "Adresse e-mail ou mot de passe incorrect." });
      return;
    }
    try {
      const uri = getAdminTotpUri(email);
      const qrDataUrl = await QRCode.toDataURL(uri, { errorCorrectionLevel: "M", margin: 2, width: 240 });
      res.json({ qrDataUrl });
    } catch {
      res.status(503).json({ error: "La 2FA n’est pas configurée côté serveur." });
    }
  });
}
