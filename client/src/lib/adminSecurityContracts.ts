export type AdminAction = "certification_approve" | "certification_reject" | "subscription_change" | "subscription_cancel" | "subscription_suspend" | "subscription_delete" | "session_revoke";

export function hasAdminAccess(user: { role?: string } | null | undefined, allowDemo = false) {
  return allowDemo ? (!user || user.role === "admin") : Boolean(user && user.role === "admin");
}

export function requiresAdminConfirmation(action: AdminAction) {
  return [
    "certification_approve",
    "certification_reject",
    "subscription_change",
    "subscription_cancel",
    "subscription_suspend",
    "subscription_delete",
    "session_revoke",
  ].includes(action);
}

export function canExecuteAdminAction(action: AdminAction, confirmed: boolean) {
  return requiresAdminConfirmation(action) ? confirmed : true;
}
