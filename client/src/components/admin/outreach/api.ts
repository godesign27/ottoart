import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Data for Admin › Outreach (server/outreach.ts). Gmail tokens never reach the browser; only the account name does.

export interface StepSummary {
  id: string;
  step: 1 | 2;
  subject: string;
  body: string;
  productIds: string[];
  hasDraft: boolean;
  threadId: string | null;
  draftCreatedAt: string | null;
  sentAt: string | null;
}

export interface ProspectRow {
  id: string;
  company: string;
  category: string;
  contactName: string | null;
  title: string | null;
  email: string | null;
  website: string | null;
  city: string;
  hook: string | null;
  notes: string | null;
  plannedWeek: string | null;
  status: string;
  boardId: string | null;
  optedOutAt: string | null;
  createdAt: string;
  board: {
    id: string; slug: string; name: string; url: string; productIds: string[];
    works: { id: string; name: string; dimensions: string | null }[];
    views: number; lastViewedAt: string | null;
  } | null;
  steps: { 1: StepSummary | null; 2: StepSummary | null };
  followUpDueAt: string | null;
  followUpDue: boolean;
}

export interface Dashboard {
  weekOf: string;
  categories: { category: string; prospect: ProspectRow | null; plannedForThisWeek: boolean; doneThisWeek: { id: string; company: string } | null; remaining: number }[];
  followUpsDue: ProspectRow[];
  followUpsSoon: ProspectRow[];
  totals: { prospects: number; contacted: number; replied: number; meetings: number; won: number; boardViews: number; boardsViewed: number };
}

export interface Templates {
  templates: Record<1 | 2, { subject: string; body: string }>;
  categoryLines: Record<string, string>;
  postalAddress: string;
  categories: string[];
}

export interface GmailStatus {
  configured: boolean;
  missing: string[];
  connected: boolean;
  email: string | null;
  connectedAt: string | null;
  redirectUri: string;
}

export interface Work {
  id: string; name: string; price: string; dimensions: string | null; medium: string | null;
  image: string | null; isSold: boolean; isOriginal: boolean;
}

export const useProspects = () => useQuery<ProspectRow[]>({ queryKey: ["/api/outreach/prospects"] });
export const useDashboard = () => useQuery<Dashboard>({ queryKey: ["/api/outreach/dashboard"] });
export const useTemplates = () => useQuery<Templates>({ queryKey: ["/api/outreach/templates"] });
export const useGmailStatus = () => useQuery<GmailStatus>({ queryKey: ["/api/admin/gmail"] });

/** Refresh everything on the Outreach page after a change. */
export function refreshOutreach() {
  return queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0].startsWith("/api/outreach") || q.queryKey[0] === "/api/admin/gmail"),
  });
}

export async function send<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await apiRequest(method, url, body);
  return res.json();
}

/** The server's message from an apiRequest error ("400: {"message":"…"}"), in plain words. */
export function errorText(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const json = raw.replace(/^\d{3}:\s*/, "");
  try {
    const parsed = JSON.parse(json);
    if (parsed?.message) return parsed.message;
  } catch { /* not JSON */ }
  return /^5\d\d/.test(raw) ? "Something went wrong on the server. Try again." : json || "Something went wrong.";
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const dateYearFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function shortDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return (d.getFullYear() === new Date().getFullYear() ? dateFmt : dateYearFmt).format(d);
}

export function boardViewsLabel(p: ProspectRow) {
  if (!p.board) return "No board yet";
  if (!p.board.views) return "Not viewed yet";
  return `Viewed ${p.board.views} ${p.board.views === 1 ? "time" : "times"}, last ${shortDate(p.board.lastViewedAt)}`;
}
