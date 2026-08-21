import { describe, expect, it } from "vitest";
import { supabaseAdmin } from "./supabase";

describe("Supabase server secrets", () => {
  it("authenticates a lightweight read request with the configured secrets", async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(url).toMatch(/^https:\/\/[^/]+\.supabase\.co\/?$/);
    expect(key).toBeTruthy();

    const { data, error } = await supabaseAdmin.from("garages").select("id").limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, 15000);

  it("can read every dashboard source table without mutating data", async () => {
    const tableNames = ["users", "garages", "invoices", "kpay_payments", "certification_requests", "conversations", "messages", "reviews", "support_reports", "notifications", "subscriptions", "admin_audit_logs", "app_banners"] as const;
    for (const tableName of tableNames) {
      const { data, error } = await supabaseAdmin.from(tableName).select("id").limit(1);
      expect(error, `lecture Supabase échouée pour ${tableName}`).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    }
  }, 30000);
});
