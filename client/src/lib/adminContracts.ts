export type ExportRow = {
  id: string;
  name: string;
  meta: string;
  status: string;
  amount?: string;
  extra?: string;
};

export function buildCsv(rows: ExportRow[]) {
  const header = ["id", "nom", "details", "statut", "montant_serveur", "activite"];
  const escape = (value: string | undefined) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [header, ...rows.map((row) => [row.id, row.name, row.meta, row.status, row.amount ?? "", row.extra ?? ""])].map((line) => line.map(escape).join(",")).join("\n");
}

export function getProfessionalRoute(professionalGarageId?: string) {
  return professionalGarageId ? `/garages/${professionalGarageId}` : null;
}

export type SupportWorkflowState = {
  selectedThreadId: string | null;
  reviewedThreadId: string | null;
  confirmationOpen: boolean;
};

export function openSupportThread(state: SupportWorkflowState, threadId: string) {
  return { ...state, selectedThreadId: threadId };
}

export function markSupportThreadReviewed(state: SupportWorkflowState, threadId: string) {
  return state.selectedThreadId === threadId ? { ...state, reviewedThreadId: threadId } : state;
}

export function canSuspendAfterSupportRead(state: SupportWorkflowState) {
  return Boolean(state.selectedThreadId && state.reviewedThreadId === state.selectedThreadId);
}

export function openSuspensionConfirmation(state: SupportWorkflowState) {
  return canSuspendAfterSupportRead(state) ? { ...state, confirmationOpen: true } : state;
}
