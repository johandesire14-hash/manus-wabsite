import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function readTextFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return readTextFiles(path);
    return /\.(ts|tsx|js|jsx)$/.test(entry.name) ? [readFileSync(path, "utf8")] : [];
  });
}

function adminContext(): TrpcContext {
  return {
    user: { id: 1, openId: "exposure-test", email: "admin@example.com", name: "Exposure Test", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Supabase secret exposure", () => {
  it("keeps service-role references out of the frontend", () => {
    const clientSources = readTextFiles(join(process.cwd(), "client"));
    const clientText = clientSources.join("\n");
    expect(clientText).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(clientText).not.toContain("service_role");
    expect(clientText).not.toContain("VITE_SUPABASE");
  });

  it("inspects real tRPC admin payloads and finds no secret values", async () => {
    const caller = appRouter.createCaller(adminContext());
    const results = await Promise.all([
      caller.admin.overview(),
      caller.admin.garages(),
      caller.admin.users(),
      caller.admin.invoices(),
      caller.admin.payments(),
      caller.admin.certifications(),
      caller.admin.conversations(),
      caller.admin.messages(),
      caller.admin.reviews(),
      caller.admin.supportReports(),
      caller.admin.notifications(),
    ]);
    const serialized = JSON.stringify(results);
    expect(serialized).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(serialized).not.toContain(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "__missing_secret__");
  }, 30000);

  it("does not return secret environment values from the router source", () => {
    const routerSource = readFileSync(join(process.cwd(), "server/routers.ts"), "utf8");
    expect(routerSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(routerSource).not.toContain("process.env.SUPABASE_SERVICE_ROLE_KEY");
    expect(statSync(join(process.cwd(), "server/supabase.ts")).isFile()).toBe(true);
  });
});
