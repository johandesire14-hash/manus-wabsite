import { describe, expect, it } from "vitest";
import { BANNER_STATUSES, bannerStatusLabel, isBannerStatus } from "../client/src/lib/bannerContracts";

describe("Contrat des statuts de bannière", () => {
  it("autorise exactement brouillon, publiée et archivée", () => {
    expect(BANNER_STATUSES).toEqual(["draft", "published", "archived"]);
    for (const status of BANNER_STATUSES) expect(isBannerStatus(status)).toBe(true);
    expect(isBannerStatus("deleted")).toBe(false);
  });

  it("retourne les libellés français correspondants", () => {
    expect(bannerStatusLabel("draft")).toBe("Brouillon");
    expect(bannerStatusLabel("published")).toBe("Publiée");
    expect(bannerStatusLabel("archived")).toBe("Archivée");
  });
});
