import { describe, expect, it } from "vitest";
import { generateSync } from "otplib";
import { readFileSync } from "node:fs";
import { getAdminTotpSecret } from "./totp";

const baseUrl = process.env.ADMIN_LOGIN_TEST_BASE_URL ?? "http://127.0.0.1:3000";
const loginPageSource = readFileSync(new URL("../client/src/pages/AdminLogin.tsx", import.meta.url), "utf8");

describe("admin credential login", () => {
  it("redirects an already authenticated admin away from the login page", () => {
    expect(loginPageSource).toContain("hasAdminAccess(user)");
    expect(loginPageSource).toContain('setLocation("/")');
  });

  it("accepts the configured allowlisted administrator credentials without exposing them", async () => {
    const email = process.env.ADMIN_EMAIL_ALLOWLIST;
    const password = process.env.ADMIN_PASSWORD;

    expect(email).toBe("kmpx35692@gmail.com");
    expect(password).toBeTruthy();

    const response = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.10" },
      body: JSON.stringify({ email, password, totp: generateSync({ secret: getAdminTotpSecret() }) }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeTruthy();
    expect(await response.json()).toEqual({ success: true });
  });

  it("keeps a server-side fallback when the optional dedicated secret is absent", () => {
    const configured = process.env.ADMIN_TOTP_SECRET;
    delete process.env.ADMIN_TOTP_SECRET;
    expect(getAdminTotpSecret()).toBeTruthy();
    if (configured === undefined) delete process.env.ADMIN_TOTP_SECRET;
    else process.env.ADMIN_TOTP_SECRET = configured;
  });

  it("returns a QR code for an allowlisted administrator without exposing the secret", async () => {
    const response = await fetch(`${baseUrl}/api/auth/admin/totp/setup`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.15" },
      body: JSON.stringify({ email: process.env.ADMIN_EMAIL_ALLOWLIST, password: process.env.ADMIN_PASSWORD }),
    });
    const body = await response.json() as { qrDataUrl?: string; uri?: string };
    expect(response.status).toBe(200);
    expect(body.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(body.uri).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("JWT_SECRET");
  });

  it("requires a six-digit Authenticator code", async () => {
    const response = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.13" },
      body: JSON.stringify({ email: process.env.ADMIN_EMAIL_ALLOWLIST, password: process.env.ADMIN_PASSWORD }),
    });
    expect(response.status).toBe(428);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects an invalid Authenticator code", async () => {
    const response = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.14" },
      body: JSON.stringify({ email: process.env.ADMIN_EMAIL_ALLOWLIST, password: process.env.ADMIN_PASSWORD, totp: "000000" }),
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects an email outside the allowlist", async () => {
    const response = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.11" },
      body: JSON.stringify({
        email: "not-allowed@example.com",
        password: process.env.ADMIN_PASSWORD,
      }),
    });

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects an expired Authenticator code", async () => {
    const expiredToken = generateSync({ secret: getAdminTotpSecret(), epoch: Date.now() - 120_000 });
    const response = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.16" },
      body: JSON.stringify({ email: process.env.ADMIN_EMAIL_ALLOWLIST, password: process.env.ADMIN_PASSWORD, totp: expiredToken }),
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects a wrong password", async () => {
    const response = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.12" },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL_ALLOWLIST,
        password: "wrong-password-for-test",
      }),
    });

    expect(response.status).toBe(401);
  });
});
