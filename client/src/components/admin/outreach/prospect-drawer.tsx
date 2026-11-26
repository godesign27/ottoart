import { useEffect, useId, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, ExternalLink, Loader2, Search } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { artSrc } from "@/components/marketing/art";
import { cn } from "@/lib/utils";
import { OUTREACH_CATEGORIES, OUTREACH_STATUSES } from "@shared/outreach";
import {
  boardViewsLabel, errorText, refreshOutreach, send, shortDate, useGmailStatus, useProspect, useProspects, useTemplates,
  type ProspectRow, type Work,
} from "./api";

const usd = (v: string | number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(v));

/** One prospect: details, their board, and the two emails. */
export function ProspectDrawer({ prospectId, initialStep, onClose }: { prospectId: string | null; initialStep?: 1 | 2; onClose: () => void }) {
  // The prospect comes from the server; the list row (if already loaded) only fills in while it arrives.
  const { data: list } = useProspects();
  const single = useProspect(prospectId);
  const prospect = single.data ?? list?.find((p) => p.id === prospectId) ?? null;
  return (
    <Sheet open={!!prospectId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {prospect ? <DrawerBody key={prospect.id} prospect={prospect} initialStep={initialStep} onClose={onClose} />
          : single.isError ? (
            <div className="space-y-4">
              <SheetHeader><SheetTitle>Prospect</SheetTitle><SheetDescription>This prospect couldn't be loaded.</SheetDescription></SheetHeader>
              <p className="text-sm text-muted-foreground">{errorText(single.error)}</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => single.refetch()}>Try again</Button>
                <Button variant="ghost" onClick={onClose}>Close</Button>
              </div>
            </div>
          ) : (
            <SheetHeader><SheetTitle>Prospect</SheetTitle><SheetDescription className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Loading…</SheetDescription></SheetHeader>
          )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({ prospect: p, initialStep, onClose }: { prospect: ProspectRow; initialStep?: 1 | 2; onClose: () => void }) {
  const { toast } = useToast();
  const status = useMutation({
    mutationFn: (value: string) => send("PATCH", `/api/outreach/prospects/${p.id}`, { status: value }),
    onSuccess: () => refreshOutreach(),
    onError: (e) => toast({ title: "Status not changed", description: errorText(e), variant: "destructive" }),
  });
  const statusId = useId();

  return (
    <div className="space-y-8 pb-10">
      <SheetHeader className="space-y-1 text-left">
        <SheetTitle className="text-2xl">{p.company}</SheetTitle>
        <SheetDescription>{[p.category, p.city].filter(Boolean).join(" · ")}</SheetDescription>
      </SheetHeader>

      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor={statusId} className="text-sm">Status</Label>
        <Select value={p.status} onValueChange={(v) => status.mutate(v)}>
          <SelectTrigger id={statusId} className="w-48" data-testid="drawer-status"><SelectValue /></SelectTrigger>
          <SelectContent>{OUTREACH_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
        {p.status === "opted_out" && <p className="text-sm text-destructive">Opted out: nothing can be drafted or sent.</p>}
      </div>

      <Timeline p={p} />
      <BoardSection p={p} />
      <ComposeSection p={p} initialStep={initialStep} />
      <DetailsSection p={p} onDeleted={onClose} />
    </div>
  );
}

function Timeline({ p }: { p: ProspectRow }) {
  const s1 = p.steps[1], s2 = p.steps[2];
  const rows = [
    { label: "Email 1", value: s1?.sentAt ? `Sent ${shortDate(s1.sentAt)}` : s1?.hasDraft ? `Draft in Gmail since ${shortDate(s1.draftCreatedAt)}` : "Not written yet" },
    {
      label: "Follow-up",
      value: s2?.sentAt ? `Sent ${shortDate(s2.sentAt)}` : s2?.hasDraft ? `Draft in Gmail since ${shortDate(s2.draftCreatedAt)}`
        : p.followUpDueAt ? (p.followUpDue ? `Due since ${shortDate(p.followUpDueAt)}` : `Due ${shortDate(p.followUpDueAt)}`) : "—",
    },
    { label: "Board", value: boardViewsLabel(p) },
  ];
  return (
    <dl className="grid gap-px bg-border sm:grid-cols-3">
      {rows.map((r) => (
        <div key={r.label} className="bg-background p-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.label}</dt>
          <dd className="mt-1 text-sm">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------- Board ----------

function BoardSection({ p }: { p: ProspectRow }) {
  const { toast } = useToast();
  const [picking, setPicking] = useState(false);
  const { data: boards = [] } = useQuery<{ id: string; name: string; slug: string; status: string }[]>({ queryKey: ["/api/outreach/boards"] });
  const save = useMutation({
    mutationFn: (body: { productIds: string[] } | { boardId: string }) => send("PUT", `/api/outreach/prospects/${p.id}/board`, body),
    onSuccess: () => { refreshOutreach(); setPicking(false); toast({ title: "Board saved" }); },
    onError: (e) => toast({ title: "Board not saved", description: errorText(e), variant: "destructive" }),
  });
  const reuseId = useId();

  return (
    <section aria-labelledby="board-h" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="board-h" className="text-lg font-semibold">Their board</h3>
        {p.board && (
          <a href={p.board.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline underline-offset-4">
            Open /for/{p.board.slug.slice(0, 18)}… <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        )}
      </div>
      {p.board?.works.length ? (
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {p.board.works.map((w) => <li key={w.id}>{w.name}{w.dimensions ? <span className="text-muted-foreground"> · {w.dimensions}</span> : null}</li>)}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">No works chosen yet. The email's {"{{board_link}}"} needs a board with at least one work.</p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Button variant="secondary" onClick={() => setPicking(true)} data-testid="pick-works">{p.board ? "Change works" : "Choose works"}</Button>
        {boards.length > 0 && (
          <div className="flex-1 space-y-1">
            <Label htmlFor={reuseId} className="text-xs text-muted-foreground">Or use an existing board</Label>
            <Select value={p.boardId ?? ""} onValueChange={(boardId) => save.mutate({ boardId })}>
              <SelectTrigger id={reuseId}><SelectValue placeholder="Pick a board" /></SelectTrigger>
              <SelectContent>{boards.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Prices on the board always come from the shop listing, so they stay current.</p>
      {picking && <WorksPicker initial={p.board?.productIds ?? []} saving={save.isPending} onSave={(productIds) => save.mutate({ productIds })} onClose={() => setPicking(false)} />}
    </section>
  );
}

function WorksPicker({ initial, saving, onSave, onClose }: { initial: string[]; saving: boolean; onSave: (ids: string[]) => void; onClose: () => void }) {
  const { data: works = [], isLoading } = useQuery<Work[]>({ queryKey: ["/api/outreach/works"] });
  const [chosen, setChosen] = useState<string[]>(initial);
  const [q, setQ] = useState("");
  const shown = useMemo(() => works.filter((w) => w.name.toLowerCase().includes(q.trim().toLowerCase())), [works, q]);
  const toggle = (id: string) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose works</DialogTitle>
          <DialogDescription>They appear on the board in the order you pick them. The last one picked fills {"{{featured_work}}"} in the follow-up.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title" className="pl-9" aria-label="Search works" />
        </div>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading works…</p> : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {shown.map((w) => {
              const n = chosen.indexOf(w.id);
              return (
                <li key={w.id}>
                  <button type="button" onClick={() => toggle(w.id)} aria-pressed={n >= 0}
                    className={cn("relative w-full text-left outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring", n >= 0 && "ring-2 ring-primary")}>
                    {w.image ? <img src={artSrc(w.image, 320)} alt="" loading="lazy" className="aspect-square w-full bg-secondary object-cover" />
                      : <span className="flex aspect-square items-center justify-center bg-secondary text-xs text-muted-foreground">No image</span>}
                    {n >= 0 && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">{n + 1}</span>}
                    <span className="mt-1 block truncate text-sm font-medium">{w.name}</span>
                    <span className="block text-xs text-muted-foreground">{w.isSold ? "Sold" : usd(w.price)}{w.dimensions ? ` · ${w.dimensions}` : ""}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <DialogFooter className="gap-2 sm:items-center">
          <p className="mr-auto text-sm text-muted-foreground">{chosen.length} chosen</p>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(chosen)} disabled={!chosen.length || saving}>{saving ? "Saving…" : "Save board"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Compose ----------

interface Preview { to: string | null; subject: string; text: string; html: string; problems: string[] }

function ComposeSection({ p, initialStep }: { p: ProspectRow; initialStep?: 1 | 2 }) {
  const { toast } = useToast();
  const { data: tpl } = useTemplates();
  const { data: gmail } = useGmailStatus();
  const defaultStep: 1 | 2 = initialStep ?? (p.steps[1]?.sentAt ? 2 : 1);
  const [step, setStep] = useState<1 | 2>(defaultStep);
  const row = p.steps[step];
  const sent = !!row?.sentAt;
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [early, setEarly] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const subjectId = useId(), bodyId = useId(), earlyId = useId();

  // Start from the saved draft for this step, or the template.
  useEffect(() => {
    if (!tpl) return;
    setSubject(row?.subject ?? tpl.templates[step].subject);
    setBody(row?.body ? stripFooter(row.body, tpl.postalAddress) : tpl.templates[step].body);
    setEarly(false);
  }, [tpl, step, row?.id, row?.draftCreatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live preview, merged on the server so it matches the Gmail draft exactly.
  useEffect(() => {
    if (!tpl || sent) return;
    const t = setTimeout(() => {
      send<Preview>("POST", `/api/outreach/prospects/${p.id}/steps/${step}/preview`, { subject, body, early })
        .then(setPreview).catch(() => setPreview(null));
    }, 350);
    return () => clearTimeout(t);
  }, [p.id, step, subject, body, early, tpl, sent, p.board?.slug, p.board?.productIds.join(","), p.email, p.contactName, p.status]);

  const draft = useMutation({
    mutationFn: () => send<{ gmailUrl: string }>("POST", `/api/outreach/prospects/${p.id}/steps/${step}/draft`, { subject, body, early }),
    onSuccess: (r) => {
      refreshOutreach();
      toast({
        title: row?.hasDraft ? "Gmail draft updated" : "Draft created in Gmail",
        description: <a href={r.gmailUrl} target="_blank" rel="noreferrer" className="underline">Open Gmail drafts</a>,
      });
    },
    onError: (e) => toast({ title: "No draft created", description: errorText(e), variant: "destructive" }),
  });
  const sendNow = useMutation({
    mutationFn: () => send("POST", `/api/outreach/prospects/${p.id}/steps/${step}/send`, { confirm: true, early }),
    onSuccess: () => { refreshOutreach(); setConfirmSend(false); toast({ title: `Email ${step === 1 ? "1" : "2"} sent to ${p.email}` }); },
    onError: (e) => { setConfirmSend(false); refreshOutreach(); toast({ title: "Not sent", description: errorText(e), variant: "destructive" }); },
  });

  const step2NotDue = step === 2 && !!p.steps[1]?.sentAt && !p.followUpDue && !p.steps[2];
  const blocked = (preview?.problems.length ?? 0) > 0 || !gmail?.connected;

  return (
    <section aria-labelledby="compose-h" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="compose-h" className="text-lg font-semibold">Email</h3>
        <div className="inline-flex bg-secondary p-1" role="group" aria-label="Which email">
          {([1, 2] as const).map((s) => (
            <button key={s} type="button" aria-pressed={step === s} onClick={() => setStep(s)}
              className={cn("min-h-9 px-3 text-sm font-semibold", step === s ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {s === 1 ? "Email 1" : "Follow-up"}
            </button>
          ))}
        </div>
      </div>

      {sent ? (
        <div className="space-y-2 bg-muted/50 p-4">
          <p className="text-sm font-medium">Sent {shortDate(row!.sentAt)} to {p.email}</p>
          <p className="font-medium">{row!.subject}</p>
          <p className="whitespace-pre-wrap text-sm">{row!.body}</p>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <Label>To</Label>
            <p className="text-sm">{p.email ? <>{p.contactName ? `${p.contactName} · ` : ""}{p.email}</> : <span className="text-destructive">No email address yet. Add one under Details.</span>}</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor={subjectId}>Subject</Label>
            <Input id={subjectId} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={300} />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <Label htmlFor={bodyId}>Message</Label>
              {tpl && <button type="button" className="text-xs underline underline-offset-4" onClick={() => { setSubject(tpl.templates[step].subject); setBody(tpl.templates[step].body); }}>Reset to template</button>}
            </div>
            <Textarea id={bodyId} value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">Merge fields: {"{{first_name}} {{company}} {{board_link}} {{category_line}} {{featured_work}}"}. The address and opt-out line are added below your message automatically.</p>
          </div>

          {step2NotDue && (
            <div className="flex items-start gap-3 bg-muted/50 p-3">
              <Checkbox id={earlyId} checked={early} onCheckedChange={(v) => setEarly(v === true)} />
              <Label htmlFor={earlyId} className="text-sm font-normal leading-snug">
                The follow-up is due {shortDate(p.followUpDueAt)}. Write it early anyway.
              </Label>
            </div>
          )}

          <div aria-live="polite" className="space-y-3">
            {preview?.problems.length ? (
              <div className="border-l-4 border-destructive bg-destructive/5 p-3">
                <p className="text-sm font-semibold">Before this can be drafted</p>
                <ul className="mt-1 list-disc pl-5 text-sm">{preview.problems.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ) : null}
            {!gmail?.connected && <p className="text-sm text-destructive">Connect Gmail in the Settings tab to create drafts.</p>}
            {preview && (
              <figure className="border bg-card">
                <figcaption className="border-b px-4 py-2 text-xs text-muted-foreground">Preview · <span className="font-medium text-foreground">{preview.subject || "(no subject)"}</span></figcaption>
                <div className="prose prose-sm max-w-none px-4 py-3 dark:prose-invert [&_a]:underline" dangerouslySetInnerHTML={{ __html: preview.html }} />
              </figure>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => draft.mutate()} disabled={blocked || draft.isPending} data-testid="create-draft">
              {draft.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              {row?.hasDraft ? "Update Gmail draft" : "Create Gmail draft"}
            </Button>
            {row?.hasDraft && (
              <Button variant="secondary" onClick={() => setConfirmSend(true)} disabled={sendNow.isPending || !gmail?.connected} data-testid="send-now">Send now…</Button>
            )}
          </div>
          {row?.hasDraft && <p className="text-xs text-muted-foreground">The draft is waiting in Gmail{gmail?.email ? ` (${gmail.email})` : ""}. You can send it from there, or here. Nothing is ever sent on its own.</p>}
        </>
      )}

      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send {step === 1 ? "Email 1" : "the follow-up"} to {p.contactName || p.company}?</AlertDialogTitle>
            <AlertDialogDescription>
              The Gmail draft goes to {p.email} from {gmail?.email ?? "your Gmail account"} right away. It can't be unsent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep as draft</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); sendNow.mutate(); }} disabled={sendNow.isPending}>
              {sendNow.isPending ? "Sending…" : `Send to ${p.email}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

/** A saved draft includes the footer; take it off so editing doesn't add it twice. */
function stripFooter(body: string, address: string) {
  const i = body.lastIndexOf("\n\nOtto Artwork · ");
  return i >= 0 && address ? body.slice(0, i) : body;
}

// ---------- Details ----------

function DetailsSection({ p, onDeleted }: { p: ProspectRow; onDeleted: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState(() => detailsOf(p));
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => setForm(detailsOf(p)), [p]);
  const dirty = JSON.stringify(form) !== JSON.stringify(detailsOf(p));
  const save = useMutation({
    mutationFn: () => send("PATCH", `/api/outreach/prospects/${p.id}`, { ...form, plannedWeek: form.plannedWeek || null }),
    onSuccess: () => { refreshOutreach(); toast({ title: "Details saved" }); },
    onError: (e) => toast({ title: "Not saved", description: errorText(e), variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: () => send("DELETE", `/api/outreach/prospects/${p.id}`),
    onSuccess: () => { refreshOutreach(); onDeleted(); toast({ title: `${p.company} removed` }); },
    onError: (e) => toast({ title: "Not removed", description: errorText(e), variant: "destructive" }),
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const field = (k: keyof typeof form, label: string, props: Record<string, unknown> = {}) => (
    <div className="space-y-1">
      <Label htmlFor={`f-${k}`}>{label}</Label>
      <Input id={`f-${k}`} value={form[k]} onChange={set(k)} {...props} />
    </div>
  );

  return (
    <section aria-labelledby="details-h" className="space-y-4">
      <h3 id="details-h" className="text-lg font-semibold">Details</h3>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("company", "Company", { required: true })}
          <div className="space-y-1">
            <Label htmlFor="f-category">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger id="f-category"><SelectValue /></SelectTrigger>
              <SelectContent>{OUTREACH_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {field("contactName", "Contact name", { autoComplete: "off" })}
          {field("title", "Their title")}
          {field("email", "Email", { type: "email", autoComplete: "off" })}
          {field("website", "Website")}
          {field("city", "City")}
          {field("plannedWeek", "Planned week", { type: "date" })}
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-hook">Why they fit</Label>
          <Textarea id="f-hook" value={form.hook} onChange={set("hook")} rows={2} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-notes">Notes</Label>
          <Textarea id="f-notes" value={form.notes} onChange={set("notes")} rows={3} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!dirty || save.isPending}>{save.isPending ? "Saving…" : dirty ? "Save details" : <><Check className="mr-1 h-4 w-4" aria-hidden />Saved</>}</Button>
          <Button type="button" variant="ghost" className="ml-auto text-destructive" onClick={() => setConfirmDelete(true)}>Remove prospect</Button>
        </div>
      </form>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {p.company}?</AlertDialogTitle>
            <AlertDialogDescription>Their record and email history here are deleted. Their board stays in Admin › Boards, and anything in Gmail stays in Gmail.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function detailsOf(p: ProspectRow) {
  return {
    company: p.company, category: p.category, contactName: p.contactName ?? "", title: p.title ?? "", email: p.email ?? "",
    website: p.website ?? "", city: p.city ?? "", plannedWeek: p.plannedWeek ?? "", hook: p.hook ?? "", notes: p.notes ?? "",
  };
}

