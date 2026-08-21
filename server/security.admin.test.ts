import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type User = NonNullable<TrpcContext["user"]>;

function contextFor(user: User | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const baseUser: User = {
  id: 1,
  openId: "security-test",
  email: "security@example.com",
  name: "Security Test",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("admin sensitive actions", () => {
  it("refuses visitors and non-admin users", async () => {
    await expect(appRouter.createCaller(contextFor(null)).admin.authorizeSensitiveAction({ action: "subscription_delete" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(contextFor(baseUser)).admin.authorizeSensitiveAction({ action: "subscription_delete" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses certification decisions before any database write for non-admin users", async () => {
    await expect(appRouter.createCaller(contextFor(null)).admin.decideCertification({ id: "never-written", decision: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(contextFor(baseUser)).admin.decideCertification({ id: "never-written", decision: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an administrator to authorize a sensitive action", async () => {
    const admin = { ...baseUser, role: "admin" as const };
    await expect(appRouter.createCaller(contextFor(admin)).admin.authorizeSensitiveAction({ action: "certification_approve" })).resolves.toMatchObject({ allowed: true, action: "certification_approve", adminId: 1 });
  });

  it("allows an administrator to read real garages through the protected tRPC procedure", async () => {
    const admin = { ...baseUser, role: "admin" as const };
    const garages = await appRouter.createCaller(contextFor(admin)).admin.garages();
    expect(Array.isArray(garages)).toBe(true);
  });
});
