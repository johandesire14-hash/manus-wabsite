export const BANNER_STATUSES = ["draft", "published", "archived"] as const;

export type BannerStatus = (typeof BANNER_STATUSES)[number];

export function isBannerStatus(value: string): value is BannerStatus {
  return (BANNER_STATUSES as readonly string[]).includes(value);
}

export function bannerStatusLabel(status: BannerStatus): string {
  return {
    draft: "Brouillon",
    published: "Publiée",
    archived: "Archivée",
  }[status];
}
