import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Check, Copy, Loader2, Star, Trash2 } from "lucide-react";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ActionButton, ActionLink, Frame } from "@/components/marketing/primitives";
import { artSrc, artSrcSet } from "@/components/marketing/art";
import { useToast } from "@/hooks/use-toast";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { errorMessage, signInHref, useBoardMutations, useMyBoard, useMyBoards, type MyBoardDetail, type MyBoardItem } from "@/hooks/use-my-boards";
import { QUOTE_INTENTS } from "@shared/buyerBoards";

const usd = (v: string | number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(v));
const longDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// One of a buyer's own boards: notes on each piece, a share link for colleagues, and "Send to Otto for a quote".
export default function MyBoardPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { isSignedIn, authLoaded } = useMyBoards();
  const { data, isLoading, error } = useMyBoard(id);
  useDocumentMeta({ title: `${data?.board.name ?? "Board"} | Otto Art`, description: "A board of Otto Art works." });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LiveSiteNavigation />
      <main id="main" className="flex-1">
        <Frame className="py-10 md:py-14">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
            <ol className="flex flex-wrap gap-2">
              <li><Link href="/boards" className="underline-offset-4 hover:text-foreground hover:underline">Your boards</Link></li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-foreground">{data?.board.name ?? "Board"}</li>
            </ol>
          </nav>
          {!authLoaded ? null : !isSignedIn ? (
            <div className="max-w-xl bg-card p-6 md:p-8">
              <p className="text-lg font-semibold">Sign in to see this board</p>
              <p className="mt-2 text-muted-foreground">Boards belong to the account that made them.</p>
              <div className="mt-6"><ActionLink href={signInHref()}>Sign in</ActionLink></div>
            </div>
          ) : isLoading ? (
            <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Loading the board</p>
          ) : error || !data ? (
            <div className="max-w-xl bg-muted/50 p-6 md:p-8">
              <h1 className="text-lg font-semibold">We couldn't find this board</h1>
              <p className="mt-2 text-muted-foreground">It may have been deleted, or it belongs to another account.</p>
              <div className="mt-6"><ActionLink href="/boards" variant="quiet">Back to your boards</ActionLink></div>
            </div>
          ) : (
            <BoardBody detail={data} />
          )}
        </Frame>
      </main>
      <Footer />
    </div>
  );
}

function BoardBody({ detail }: { detail: MyBoardDetail }) {
  const { board, items } = detail;
  const [quoteOpen, setQuoteOpen] = useState(false);
  const stars = items.reduce((n, i) => n + i.starredBy.length, 0);

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <BoardTitle id={board.id} name={board.name} description={board.description} />
          <p className="mt-4 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "work" : "works"}{stars ? ` · ${stars} ${stars === 1 ? "star" : "stars"} from colleagues` : ""}
          </p>
        </div>
        <aside className="space-y-4 lg:col-span-5" aria-label="Board actions">
          {board.quoteRequestedAt ? (
            <div className="bg-brand-soft p-5">
              <p className="font-semibold">Sent to Otto on {longDate(board.quoteRequestedAt)}</p>
              <p className="mt-1 text-sm">Otto will reply by email. Changed the board since? Send it again.</p>
            </div>
          ) : null}
          <ActionButton className="w-full" onClick={() => setQuoteOpen(true)} disabled={items.length === 0} data-testid="send-board-quote">
            {board.quoteRequestedAt ? "Send the board again" : "Send to Otto for a quote"}
          </ActionButton>
          {items.length === 0 && <p className="text-sm text-muted-foreground">Add at least one artwork to send the board.</p>}
          <ShareControl id={board.id} slug={board.slug} shared={board.shared} />
        </aside>
      </div>

      <section aria-label="Works on this board" className="mt-14">
        {items.length === 0 ? (
          <div className="bg-muted/50 p-6 md:p-8">
            <p className="text-lg font-semibold">Nothing on this board yet</p>
            <p className="mt-2 max-w-[52ch] text-muted-foreground">Open any artwork and choose <span className="font-medium text-foreground">Save to board</span> to add it here.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ActionLink href="/originals">Browse originals</ActionLink>
              <ActionLink href="/prints" variant="quiet">Browse prints</ActionLink>
            </div>
          </div>
        ) : (
          <ol className="space-y-10">
            {items.map((item) => <BoardItemRow key={item.id} boardId={board.id} item={item} />)}
          </ol>
        )}
      </section>

      <DeleteBoard id={board.id} name={board.name} />
      <QuoteDialog open={quoteOpen} onOpenChange={setQuoteOpen} detail={detail} />
    </>
  );
}

function BoardTitle({ id, name, description }: { id: string; name: string; description: string | null }) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftDesc, setDraftDesc] = useState(description ?? "");
  const [error, setError] = useState<string | null>(null);
  const { update } = useBoardMutations();
  const nameId = useId(), descId = useId(), errId = useId();

  if (!editing) {
    return (
      <div>
        <h1 className="font-display text-[2.5rem] leading-[1.02] tracking-[-0.03em] text-balance md:text-[3.5rem]">{name}</h1>
        {description && <p className="mt-4 max-w-[60ch] text-lg leading-relaxed">{description}</p>}
        <Button variant="link" className="mt-2 h-auto p-0 text-sm" onClick={() => { setDraftName(name); setDraftDesc(description ?? ""); setEditing(true); }}>
          Rename or describe the space
        </Button>
      </div>
    );
  }
  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!draftName.trim()) { setError("Give the board a name"); return; }
    update.mutate({ id, name: draftName.trim(), description: draftDesc.trim() || null }, {
      onSuccess: () => { setEditing(false); setError(null); },
      onError: (err) => setError(errorMessage(err)),
    });
  };
  return (
    <form onSubmit={save} noValidate className="max-w-xl space-y-4">
      <div className="space-y-2">
        <label htmlFor={nameId} className="text-sm font-medium">Name</label>
        <Input id={nameId} value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={80} autoFocus
          aria-invalid={Boolean(error)} aria-describedby={error ? errId : undefined} />
        {error && <p id={errId} role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor={descId} className="text-sm font-medium">About the space <span className="font-normal text-muted-foreground">(optional)</span></label>
        <Textarea id={descId} value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} maxLength={500} rows={3} />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={update.isPending}>Save</Button>
        <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </form>
  );
}

function ShareControl({ id, slug, shared }: { id: string; slug: string; shared: boolean }) {
  const { update } = useBoardMutations();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const switchId = useId(), helpId = useId();
  const link = `${window.location.origin}/board/${slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy the link", description: "Select the link and copy it yourself." });
    }
  };

  return (
    <div className="bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label htmlFor={switchId} className="font-semibold">Share with colleagues</label>
          <p id={helpId} className="mt-1 text-sm text-muted-foreground">Anyone with the link can view the board and star their picks. Your notes show to them too.</p>
        </div>
        <Switch id={switchId} checked={shared} aria-describedby={helpId} disabled={update.isPending}
          onCheckedChange={(v) => update.mutate({ id, shared: v }, { onError: (e) => toast({ title: "Not changed", description: errorMessage(e), variant: "destructive" }) })} />
      </div>
      {shared && (
        <div className="mt-4 flex gap-2">
          <Input readOnly value={link} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} className="min-w-0 text-sm" />
          <Button type="button" variant="secondary" className="shrink-0 gap-2" onClick={copy}>
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

function BoardItemRow({ boardId, item }: { boardId: string; item: MyBoardItem }) {
  const { setNote, removeItem } = useBoardMutations();
  const { toast } = useToast();
  const [note, setNoteText] = useState(item.note ?? "");
  const [savedNote, setSavedNote] = useState(item.note ?? "");
  const noteId = useId(), statusId = useId();
  const p = item.product;
  const image = p.images?.[0];
  const unavailable = p.status !== "active";
  const dirty = note.trim() !== savedNote.trim();

  useEffect(() => { setNoteText(item.note ?? ""); setSavedNote(item.note ?? ""); }, [item.note]);

  const saveNote = () => {
    if (!dirty) return;
    setNote.mutate({ id: boardId, itemId: item.id, note: note.trim() || null }, {
      onSuccess: () => setSavedNote(note.trim()),
      onError: (e) => toast({ title: "Note not saved", description: errorMessage(e), variant: "destructive" }),
    });
  };

  return (
    <li className="grid gap-5 sm:grid-cols-[minmax(0,14rem)_1fr] md:gap-8">
      <Link href={`/product/${p.id}`} className="block bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
        {image ? (
          <img src={artSrc(image, 480)} srcSet={artSrcSet(image, [320, 480, 640])} sizes="(min-width: 640px) 14rem, 100vw" alt={p.name}
            loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover" />
        ) : <span className="flex aspect-[4/5] items-center justify-center text-sm text-muted-foreground">No image</span>}
      </Link>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <Link href={`/product/${p.id}`} className="text-xl font-semibold underline-offset-4 hover:underline">{p.name}</Link>
          <span className="tabular text-lg">{usd(p.price)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{[p.dimensions, p.medium].filter(Boolean).join(" · ")}</p>
        {(p.isSold || unavailable) && <p className="mt-2 text-sm font-medium">{p.isSold ? "The original has sold. Prints may still be available." : "No longer listed in the shop."}</p>}
        {item.starredBy.length > 0 && (
          <p className="mt-3 flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 fill-current" aria-hidden />
            Starred by {item.starredBy.join(", ")}
          </p>
        )}
        <div className="mt-5 max-w-xl space-y-2">
          <label htmlFor={noteId} className="text-sm font-medium">Note</label>
          <Textarea id={noteId} value={note} onChange={(e) => setNoteText(e.target.value)} onBlur={saveNote} maxLength={500} rows={2}
            placeholder="Where it goes, size or print option, questions for Otto" aria-describedby={statusId} />
          <p id={statusId} className="text-sm text-muted-foreground" aria-live="polite">
            {setNote.isPending ? "Saving…" : dirty ? "Saves when you leave the box" : savedNote ? "Saved" : ""}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-2 gap-2 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          disabled={removeItem.isPending}
          onClick={() => removeItem.mutate({ id: boardId, itemId: item.id }, {
            onSuccess: () => toast({ title: `Removed ${p.name}` }),
            onError: (e) => toast({ title: "Not removed", description: errorMessage(e), variant: "destructive" }),
          })}>
          <Trash2 className="h-4 w-4" aria-hidden />Remove from board
        </Button>
      </div>
    </li>
  );
}

function DeleteBoard({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const { remove } = useBoardMutations();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  return (
    <div className="mt-20">
      <Button type="button" variant="ghost" className="gap-2 px-0 text-muted-foreground hover:bg-transparent hover:text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" aria-hidden />Delete this board
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
            <AlertDialogDescription>The board, its notes and colleagues' stars are deleted, and the share link stops working. The artworks stay in the shop. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep the board</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => remove.mutate(id, {
                onSuccess: () => { toast({ title: `Deleted ${name}` }); navigate("/boards"); },
                onError: (e) => toast({ title: "Not deleted", description: errorMessage(e), variant: "destructive" }),
              })}>
              Delete board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function QuoteDialog({ open, onOpenChange, detail }: { open: boolean; onOpenChange: (o: boolean) => void; detail: MyBoardDetail }) {
  const prev = detail.board.quoteDetails ?? {};
  const [intent, setIntent] = useState<keyof typeof QUOTE_INTENTS>((detail.board.quoteIntent as keyof typeof QUOTE_INTENTS) || "not-sure");
  const [location, setLocation] = useState(prev.location ?? "");
  const [timing, setTiming] = useState(prev.timing ?? "");
  const [phone, setPhone] = useState(prev.phone ?? "");
  const [message, setMessage] = useState(prev.message ?? "");
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { quote } = useBoardMutations();
  const locRef = useRef<HTMLInputElement>(null);
  const ids = { loc: useId(), timing: useId(), phone: useId(), msg: useId(), err: useId(), locErr: useId(), intent: useId() };

  useEffect(() => { if (open) { setSent(false); setError(null); setLocationError(null); } }, [open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!location.trim()) { setLocationError("Tell us the city or address the art is for"); locRef.current?.focus(); return; }
    setLocationError(null);
    setError(null);
    quote.mutate({ id: detail.board.id, intent, location: location.trim(), timing: timing.trim() || null, phone: phone.trim() || null, message: message.trim() || null }, {
      onSuccess: () => setSent(true),
      onError: (err) => setError(errorMessage(err, "We couldn't send the board. Nothing was lost; try again in a moment.")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle>Sent to Otto</DialogTitle>
              <DialogDescription>
                Otto has your board with {detail.items.length} {detail.items.length === 1 ? "work" : "works"} and your notes, and will reply to the email on your account.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => onOpenChange(false)}>Back to the board</Button>
          </>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <DialogHeader>
              <DialogTitle>Send to Otto for a quote</DialogTitle>
              <DialogDescription>Otto gets the board, every note on it and these details, and replies by email. Nothing is charged or reserved.</DialogDescription>
            </DialogHeader>
            <fieldset className="min-w-0 space-y-3">
              <legend id={ids.intent} className="text-sm font-medium">Are you looking to</legend>
              <RadioGroup value={intent} onValueChange={(v) => setIntent(v as keyof typeof QUOTE_INTENTS)} aria-labelledby={ids.intent} className="grid gap-2 sm:grid-cols-3">
                {Object.entries(QUOTE_INTENTS).map(([value, label]) => (
                  <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 bg-muted/60 px-3 text-sm has-[:checked]:bg-accent">
                    <RadioGroupItem value={value} />{label}
                  </label>
                ))}
              </RadioGroup>
            </fieldset>
            <div className="space-y-2">
              <label htmlFor={ids.loc} className="text-sm font-medium">Where is the space? <span className="font-normal text-muted-foreground">(required)</span></label>
              <Input id={ids.loc} ref={locRef} value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} placeholder="City, or the address"
                aria-invalid={Boolean(locationError)} aria-describedby={locationError ? ids.locErr : undefined} />
              {locationError && <p id={ids.locErr} role="alert" className="text-sm text-destructive">{locationError}</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor={ids.timing} className="text-sm font-medium">When <span className="font-normal text-muted-foreground">(optional)</span></label>
                <Input id={ids.timing} value={timing} onChange={(e) => setTiming(e.target.value)} maxLength={80} placeholder="e.g. by March" />
              </div>
              <div className="space-y-2">
                <label htmlFor={ids.phone} className="text-sm font-medium">Phone <span className="font-normal text-muted-foreground">(optional)</span></label>
                <Input id={ids.phone} type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor={ids.msg} className="text-sm font-medium">Anything else <span className="font-normal text-muted-foreground">(optional)</span></label>
              <Textarea id={ids.msg} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={4}
                placeholder="Budget, how long you'd rent for, installation, questions" />
            </div>
            {error && <p id={ids.err} role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={quote.isPending} className="gap-2">
                {quote.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}Send board to Otto
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
