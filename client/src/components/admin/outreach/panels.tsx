import { useEffect, useId, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MERGE_FIELDS, OPT_OUT_LINE, OUTREACH_CATEGORIES, OUTREACH_STATUSES, outreachFooter, statusLabel } from "@shared/outreach";
import {
  boardViewsLabel, errorText, refreshOutreach, send, shortDate, useDashboard, useGmailStatus, useProspects, useTemplates,
  type ProspectRow,
} from "./api";

type Open = (id: string, step?: 1 | 2) => void;

function Stat({ label, value, note }: { label: string; value: number | undefined; note?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{value ?? "–"}</p>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

// ---------- This week ----------

export function ThisWeekPanel({ onOpen }: { onOpen: Open }) {
  const { data, isLoading, isError, refetch } = useDashboard();
  if (isError) return <ErrorCard onRetry={refetch} what="This week" />;
  const t = data?.totals;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-4">
        <Stat label="Prospects" value={t?.prospects} />
        <Stat label="Contacted" value={t?.contacted} note="Email 1 sent" />
        <Stat label="Replied" value={t?.replied} />
        <Stat label="Meetings" value={t?.meetings} note={t ? `${t.won} won` : undefined} />
        <Stat label="Board views" value={t?.boardViews} note={t ? `${t.boardsViewed} boards opened` : undefined} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This week{data ? `, from ${shortDate(data.weekOf)}` : ""}</CardTitle>
          <CardDescription>One company per category. When the one planned for this week is done, the next uncontacted one shows.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="h-48 animate-pulse bg-muted" /> : (
            <ul className="divide-y">
              {data!.categories.map((c) => (
                <li key={c.category} className="grid gap-2 py-3 sm:grid-cols-[12rem_1fr_auto] sm:items-center">
                  <span className="text-sm font-medium">{c.category}</span>
                  <span className="min-w-0">
                    {c.prospect ? (
                      <>
                        <button type="button" onClick={() => onOpen(c.prospect!.id)} className="text-left font-semibold underline-offset-4 hover:underline">{c.prospect.company}</button>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {c.plannedForThisWeek ? "Planned for this week" : c.prospect.plannedWeek ? `Planned ${shortDate(c.prospect.plannedWeek)}` : "Next up"}
                          {!c.prospect.email && " · needs an email"}
                        </span>
                      </>
                    ) : <span className="text-sm text-muted-foreground">No one left to contact in this category</span>}
                    {c.doneThisWeek && <span className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground"><Check className="h-3.5 w-3.5" aria-hidden />{c.doneThisWeek.company} done this week</span>}
                  </span>
                  <span className="text-xs text-muted-foreground sm:text-right">{c.remaining} left</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-ups due</CardTitle>
          <CardDescription>Email 1 went out 5 or more business days ago with no reply. Each follow-up is written by you and sent only when you choose.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <div className="h-24 animate-pulse bg-muted" /> : data!.followUpsDue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing due.{data!.followUpsSoon[0] ? ` Next: ${data!.followUpsSoon[0].company} on ${shortDate(data!.followUpsSoon[0].followUpDueAt)}.` : ""}</p>
          ) : (
            <ul className="divide-y">
              {data!.followUpsDue.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span>
                    <span className="font-semibold">{p.company}</span>
                    <span className="ml-2 text-sm text-muted-foreground">Email 1 sent {shortDate(p.steps[1]?.sentAt)} · {boardViewsLabel(p)}</span>
                  </span>
                  <Button size="sm" onClick={() => onOpen(p.id, 2)}>Write follow-up</Button>
                </li>
              ))}
            </ul>
          )}
          {!isLoading && data!.followUpsSoon.length > 0 && data!.followUpsDue.length > 0 && (
            <p className="text-sm text-muted-foreground">Coming up: {data!.followUpsSoon.slice(0, 5).map((p) => `${p.company} (${shortDate(p.followUpDueAt)})`).join(", ")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Prospects ----------

export function ProspectsPanel({ onOpen }: { onOpen: Open }) {
  const { data = [], isLoading, isError, refetch } = useProspects();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const shown = useMemo(() => data.filter((p) =>
    (category === "all" || p.category === category) && (status === "all" || p.status === status)
    && (!q.trim() || `${p.company} ${p.contactName ?? ""} ${p.email ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))), [data, q, category, status]);

  if (isError) return <ErrorCard onRetry={refetch} what="Prospects" />;
  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company, contact or email" aria-label="Search prospects" className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="md:w-56" aria-label="Category"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All categories</SelectItem>{OUTREACH_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="md:w-48" aria-label="Status"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem>{OUTREACH_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {isLoading ? <div className="h-64 animate-pulse bg-muted" /> : data.length === 0 ? (
          <div className="bg-muted/50 p-6">
            <p className="font-semibold">No prospects yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Import the Targets sheet as a CSV, or add companies one at a time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">Prospects, {shown.length} shown</caption>
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="py-2 pr-4 font-medium">Company</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Category</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Status</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Emails</th>
                  <th scope="col" className="py-2 font-medium">Board</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                    <th scope="row" className="py-3 pr-4 text-left font-normal">
                      <button type="button" onClick={() => onOpen(p.id)} className="text-left font-semibold underline-offset-4 hover:underline" data-testid={`prospect-${p.id}`}>{p.company}</button>
                      <span className="block text-xs text-muted-foreground">{p.contactName || p.email ? [p.contactName, p.email].filter(Boolean).join(" · ") : "Add an email"}</span>
                    </th>
                    <td className="py-3 pr-4">{p.category}</td>
                    <td className="py-3 pr-4"><StatusBadge status={p.status} /></td>
                    <td className="py-3 pr-4 text-muted-foreground">{emailsLabel(p)}</td>
                    <td className="py-3 text-muted-foreground">{boardViewsLabel(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && <p className="py-6 text-sm text-muted-foreground">No prospects match these filters.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function emailsLabel(p: ProspectRow) {
  if (p.steps[2]?.sentAt) return `Follow-up sent ${shortDate(p.steps[2].sentAt)}`;
  if (p.followUpDue) return "Follow-up due";
  if (p.steps[1]?.sentAt) return `Email 1 sent ${shortDate(p.steps[1].sentAt)}`;
  if (p.steps[1]?.hasDraft) return "Email 1 drafted";
  return "—";
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "won" || status === "meeting" ? "default" : status === "replied" ? "secondary" : status === "opted_out" || status === "lost" ? "outline" : "secondary";
  return <Badge variant={tone as "default"} className={cn(status === "not_contacted" && "bg-transparent font-normal text-muted-foreground")}>{statusLabel(status)}</Badge>;
}

// ---------- Templates ----------

export function TemplatesPanel() {
  const { toast } = useToast();
  const { data, isLoading } = useTemplates();
  const [form, setForm] = useState<{ 1: { subject: string; body: string }; 2: { subject: string; body: string }; lines: Record<string, string> } | null>(null);
  useEffect(() => { if (data) setForm({ 1: data.templates[1], 2: data.templates[2], lines: data.categoryLines }); }, [data]);
  const save = useMutation({
    mutationFn: () => send("PUT", "/api/outreach/templates", { templates: { 1: form![1], 2: form![2] }, categoryLines: form!.lines }),
    onSuccess: () => { refreshOutreach(); toast({ title: "Templates saved" }); },
    onError: (e) => toast({ title: "Not saved", description: errorText(e), variant: "destructive" }),
  });
  if (isLoading || !form || !data) return <div className="h-64 animate-pulse bg-muted" />;

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <Card>
        <CardHeader>
          <CardTitle>Merge fields</CardTitle>
          <CardDescription>Filled in for each prospect. If one has no value, the draft is blocked rather than sent with a gap.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {Object.entries(MERGE_FIELDS).map(([k, v]) => <div key={k}><dt className="inline font-mono">{`{{${k}}}`}</dt> <dd className="inline text-muted-foreground">{v}</dd></div>)}
          </dl>
        </CardContent>
      </Card>
      {([1, 2] as const).map((step) => (
        <Card key={step}>
          <CardHeader>
            <CardTitle>{step === 1 ? "Email 1" : "Email 2: follow-up"}</CardTitle>
            <CardDescription>{step === 1 ? "The first email, with their board." : "Sent in the same Gmail thread, 5 business days later, only if there's no reply."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor={`t${step}-s`}>Subject</Label>
              <Input id={`t${step}-s`} value={form[step].subject} onChange={(e) => setForm({ ...form, [step]: { ...form[step], subject: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`t${step}-b`}>Message</Label>
              <Textarea id={`t${step}-b`} rows={12} className="font-mono text-sm" value={form[step].body} onChange={(e) => setForm({ ...form, [step]: { ...form[step], body: e.target.value } })} />
            </div>
            <p className="whitespace-pre-line bg-muted/50 p-3 text-xs text-muted-foreground">
              Added below every email, and can't be removed:{"\n"}{data.postalAddress ? outreachFooter(data.postalAddress) : `Otto Artwork · (your postal address, in Settings)\n${OPT_OUT_LINE}`}
            </p>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader>
          <CardTitle>Category lines</CardTitle>
          <CardDescription>The sentence {"{{category_line}}"} becomes for each category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {OUTREACH_CATEGORIES.map((c) => (
            <div key={c} className="space-y-1">
              <Label htmlFor={`line-${c}`}>{c}</Label>
              <Textarea id={`line-${c}`} rows={2} value={form.lines[c] ?? ""} onChange={(e) => setForm({ ...form, lines: { ...form.lines, [c]: e.target.value } })} />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="sticky bottom-0 flex justify-end bg-background/90 py-3 backdrop-blur">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save templates"}</Button>
      </div>
    </form>
  );
}

// ---------- Settings ----------

export function SettingsPanel() {
  const { toast } = useToast();
  const { data: gmail, isLoading } = useGmailStatus();
  const { data: tpl } = useTemplates();
  const [address, setAddress] = useState("");
  const [confirmOff, setConfirmOff] = useState(false);
  const addressId = useId();
  useEffect(() => { if (tpl) setAddress(tpl.postalAddress); }, [tpl]);

  const connect = useMutation({
    mutationFn: () => send<{ url: string }>("POST", "/api/admin/gmail/connect"),
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (e) => toast({ title: "Can't connect yet", description: errorText(e), variant: "destructive" }),
  });
  const disconnect = useMutation({
    mutationFn: () => send("POST", "/api/admin/gmail/disconnect"),
    onSuccess: () => { refreshOutreach(); setConfirmOff(false); toast({ title: "Gmail disconnected" }); },
    onError: (e) => toast({ title: "Not disconnected", description: errorText(e), variant: "destructive" }),
  });
  const saveAddress = useMutation({
    mutationFn: () => send("PUT", "/api/outreach/templates", { postalAddress: address }),
    onSuccess: () => { refreshOutreach(); toast({ title: "Address saved" }); },
    onError: (e) => toast({ title: "Not saved", description: errorText(e), variant: "destructive" }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Gmail</CardTitle>
          <CardDescription>Drafts are created in your Gmail so you can read them there first. Otto Art can see message headers (to notice replies), never message text.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <div className="h-16 animate-pulse bg-muted" /> : gmail?.connected ? (
            <>
              <p><span className="font-semibold">{gmail.email}</span> <span className="text-sm text-muted-foreground">connected {shortDate(gmail.connectedAt)}</span></p>
              <Button variant="secondary" onClick={() => setConfirmOff(true)}>Disconnect</Button>
            </>
          ) : !gmail?.configured ? (
            <div className="space-y-2 text-sm">
              <p className="font-semibold">The server needs these settings first:</p>
              <ul className="list-disc pl-5 font-mono text-xs">{gmail?.missing.map((m) => <li key={m}>{m}</li>)}</ul>
              <p className="text-muted-foreground">Add them as secrets on Replit (see docs/outreach-setup.md), then reload this page. Redirect URI for Google Cloud: <span className="break-all font-mono text-xs text-foreground">{gmail?.redirectUri}</span></p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Not connected. You'll be sent to Google to choose the account and allow drafts.</p>
              <Button onClick={() => connect.mutate()} disabled={connect.isPending} data-testid="connect-gmail">{connect.isPending ? "Opening Google…" : "Connect Gmail"}</Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email footer</CardTitle>
          <CardDescription>Business email needs a postal address and a way to opt out. Drafting is blocked until the address is filled in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveAddress.mutate(); }}>
            <div className="space-y-1">
              <Label htmlFor={addressId}>Business postal address</Label>
              <Textarea id={addressId} rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street or PO Box, Boulder, CO 80302" />
            </div>
            <p className="whitespace-pre-line bg-muted/50 p-3 text-xs text-muted-foreground">{address.trim() ? outreachFooter(address) : `Otto Artwork · …\n${OPT_OUT_LINE}`}</p>
            <Button type="submit" disabled={saveAddress.isPending || address.trim() === (tpl?.postalAddress ?? "")}>Save address</Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOff} onOpenChange={setConfirmOff}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {gmail?.email}?</AlertDialogTitle>
            <AlertDialogDescription>Otto Art's access to Gmail is revoked. Drafts already in Gmail stay there. Replies won't be noticed until you connect again.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay connected</AlertDialogCancel>
            <AlertDialogAction onClick={() => disconnect.mutate()}>Disconnect</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------- Import and add ----------

interface ImportReport {
  saved: boolean; added: number; unchanged: number;
  filledIn: { company: string; fields: string[] }[];
  errors: { line: number; message: string }[];
  ignoredColumns: string[];
  preview: { company: string; category: string; plannedWeek: string | null; email: string | null }[];
}

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState<ImportReport | null>(null);
  const fileId = useId();
  useEffect(() => { if (!open) { setCsv(""); setFileName(""); setReport(null); } }, [open]);

  const check = useMutation({
    mutationFn: (text: string) => send<ImportReport>("POST", "/api/outreach/prospects/import", { csv: text }),
    onSuccess: setReport,
    onError: (e) => toast({ title: "Couldn't read the file", description: errorText(e), variant: "destructive" }),
  });
  const commit = useMutation({
    mutationFn: () => send<ImportReport>("POST", "/api/outreach/prospects/import", { csv, confirm: true }),
    onSuccess: (r) => { refreshOutreach(); onClose(); toast({ title: `Imported ${r.added} ${r.added === 1 ? "prospect" : "prospects"}`, description: r.filledIn.length ? `${r.filledIn.length} existing ones filled in.` : undefined }); },
    onError: (e) => toast({ title: "Not imported", description: errorText(e), variant: "destructive" }),
  });

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2_000_000) return toast({ title: "That file is too big", description: "Keep it under 2 MB.", variant: "destructive" });
    const text = await file.text();
    setFileName(file.name); setCsv(text); check.mutate(text);
  };
  const changes = report ? report.added + report.filledIn.length : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import prospects from CSV</DialogTitle>
          <DialogDescription>
            In the outreach spreadsheet, open the Targets sheet and save it as CSV. Its columns are read as they are; you'll see what will change before anything is saved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={fileId}>CSV file</Label>
          <Input id={fileId} type="file" accept=".csv,text/csv" onChange={(e) => readFile(e.target.files?.[0])} />
          {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
        </div>
        {check.isPending && <p className="text-sm text-muted-foreground">Checking the file…</p>}
        {report && (
          <div className="space-y-3 text-sm" aria-live="polite">
            <ul className="space-y-1">
              <li><span className="font-semibold">{report.added}</span> new {report.added === 1 ? "prospect" : "prospects"}</li>
              {report.filledIn.length > 0 && <li><span className="font-semibold">{report.filledIn.length}</span> existing ones get blank details filled in</li>}
              {report.unchanged > 0 && <li>{report.unchanged} already here and unchanged</li>}
              {report.ignoredColumns.length > 0 && <li className="text-muted-foreground">Not imported: {report.ignoredColumns.join(", ")} (worked out from what you send)</li>}
            </ul>
            {report.errors.length > 0 && (
              <div className="border-l-4 border-destructive bg-destructive/5 p-3">
                <p className="font-semibold">{report.errors.length} {report.errors.length === 1 ? "row is" : "rows are"} left out</p>
                <ul className="mt-1 max-h-32 overflow-y-auto">{report.errors.map((e) => <li key={e.line}>Line {e.line}: {e.message}</li>)}</ul>
              </div>
            )}
            {report.preview.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">First {report.preview.length}</p>
                <ul className="divide-y border">{report.preview.map((p, i) => <li key={i} className="flex justify-between gap-3 px-3 py-1.5"><span>{p.company}</span><span className="text-muted-foreground">{p.category}{p.plannedWeek ? ` · ${shortDate(p.plannedWeek)}` : ""}</span></li>)}</ul>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => commit.mutate()} disabled={!report || changes === 0 || commit.isPending} data-testid="confirm-import">
            {commit.isPending ? "Importing…" : changes ? `Import ${changes} ${changes === 1 ? "change" : "changes"}` : "Nothing to import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddProspectDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (id: string) => void }) {
  const { toast } = useToast();
  const empty = { company: "", category: "Corporate Office", contactName: "", email: "" };
  const [form, setForm] = useState(empty);
  useEffect(() => { if (!open) setForm(empty); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const add = useMutation({
    mutationFn: () => send<ProspectRow>("POST", "/api/outreach/prospects", form),
    onSuccess: (p) => { refreshOutreach(); onClose(); onAdded(p.id); },
    onError: (e) => toast({ title: "Not added", description: errorText(e), variant: "destructive" }),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a prospect</DialogTitle>
          <DialogDescription>You can fill in the rest after.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <div className="space-y-1"><Label htmlFor="a-company">Company</Label><Input id="a-company" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          <div className="space-y-1">
            <Label htmlFor="a-category">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger id="a-category"><SelectValue /></SelectTrigger>
              <SelectContent>{OUTREACH_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label htmlFor="a-name">Contact name</Label><Input id="a-name" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="a-email">Email</Label><Input id="a-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <DialogFooter><Button type="submit" disabled={add.isPending || !form.company.trim()}>{add.isPending ? "Adding…" : "Add prospect"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ErrorCard({ onRetry, what }: { onRetry: () => void; what: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-4 p-6">
        <p>{what} couldn't be loaded. Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => onRetry()}>Try again</Button>
      </CardContent>
    </Card>
  );
}
