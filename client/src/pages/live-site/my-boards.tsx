import { useId, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActionButton, ActionLink, Frame } from "@/components/marketing/primitives";
import { artSrc } from "@/components/marketing/art";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { errorMessage, signInHref, useBoardMutations, useMyBoards, type MyBoardSummary } from "@/hooks/use-my-boards";

const shortDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// A signed-in buyer's boards: make one, then open it to add notes, share it and send it for a quote.
export default function MyBoardsPage() {
  useDocumentMeta({ title: "Your boards | Otto Art", description: "Plan a space with Otto Art: gather works on a board, share it with colleagues and send it for a quote." });
  const { data: boards, isLoading, error, isSignedIn, authLoaded } = useMyBoards();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LiveSiteNavigation />
      <main id="main" className="flex-1">
        <Frame className="py-14 md:py-20">
          <h1 className="font-display text-[2.75rem] leading-[1.02] tracking-[-0.03em] md:text-[4rem]">Your boards</h1>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed">
            Gather works for a room or a whole office. Add a note to each piece, share the board with colleagues so they can star
            their picks, then send it to Otto for a rental or purchase quote.
          </p>

          {!authLoaded ? null : !isSignedIn ? (
            <div className="mt-10 max-w-xl bg-card p-6 md:p-8">
              <p className="text-lg font-semibold">Sign in to make boards</p>
              <p className="mt-2 text-muted-foreground">Boards are saved to your account, so they're there on any device and Otto knows who to reply to.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <ActionLink href={signInHref("/boards")}>Sign in</ActionLink>
                <ActionLink href={`/sign-up?redirect_url=${encodeURIComponent("/boards")}`} variant="quiet">Create an account</ActionLink>
              </div>
            </div>
          ) : (
            <div className="mt-12 grid gap-12 lg:grid-cols-12">
              <section aria-labelledby="new-board" className="lg:col-span-4">
                <NewBoardForm />
              </section>
              <section aria-label="Your boards" className="lg:col-span-8">
                {isLoading ? (
                  <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Loading your boards</p>
                ) : error ? (
                  <p role="alert" className="text-destructive">{errorMessage(error, "We couldn't load your boards. Refresh the page to try again.")}</p>
                ) : !boards?.length ? (
                  <div className="bg-muted/50 p-6 md:p-8">
                    <p className="text-lg font-semibold">No boards yet</p>
                    <p className="mt-2 max-w-[52ch] text-muted-foreground">
                      Make your first board here, or open any artwork and choose <span className="font-medium text-foreground">Save to board</span>.
                    </p>
                    <div className="mt-6"><ActionLink href="/shop-all" variant="quiet">Browse the collection</ActionLink></div>
                  </div>
                ) : (
                  <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
                    {boards.map((b) => <li key={b.id}><BoardCard board={b} /></li>)}
                  </ul>
                )}
              </section>
            </div>
          )}
        </Frame>
      </main>
      <Footer />
    </div>
  );
}

function BoardCard({ board }: { board: MyBoardSummary }) {
  const covers = board.covers.slice(0, 4);
  const status = [
    `${board.itemCount} ${board.itemCount === 1 ? "work" : "works"}`,
    board.shared ? "Shared" : "Private",
    board.quoteRequestedAt ? `Sent for a quote ${shortDate(board.quoteRequestedAt)}` : null,
  ].filter(Boolean).join(" · ");
  return (
    <Link href={`/boards/${board.id}`} className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" data-testid={`board-card-${board.id}`}>
      <div className="grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-1 bg-secondary">
        {covers.length === 0 ? (
          <span className="col-span-2 row-span-2 flex items-center justify-center text-sm text-muted-foreground">No works yet</span>
        ) : covers.map((src, i) => (
          <img key={i} src={artSrc(src, 480)} alt="" loading="lazy" decoding="async"
            className={`h-full w-full object-cover ${covers.length === 1 ? "col-span-2 row-span-2" : covers.length === 2 ? "row-span-2" : covers.length === 3 && i === 0 ? "row-span-2" : ""}`} />
        ))}
      </div>
      <p className="mt-4 text-lg font-semibold underline-offset-4 group-hover:underline">{board.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">{status}</p>
    </Link>
  );
}

function NewBoardForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { create } = useBoardMutations();
  const [, navigate] = useLocation();
  const nameId = useId(), descId = useId(), errId = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Give the board a name"); return; }
    setError(null);
    create.mutate({ name: name.trim(), description: description.trim() || null }, {
      onSuccess: (b) => navigate(`/boards/${b.id}`),
      onError: (err) => setError(errorMessage(err)),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="bg-card p-6">
      <h2 id="new-board" className="text-lg font-semibold">Make a board</h2>
      <div className="mt-5 space-y-2">
        <label htmlFor={nameId} className="text-sm font-medium">Name <span className="font-normal text-muted-foreground">(required)</span></label>
        <Input id={nameId} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Head office lobby"
          aria-invalid={Boolean(error)} aria-describedby={error ? errId : undefined} />
        {error && <p id={errId} role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <div className="mt-5 space-y-2">
        <label htmlFor={descId} className="text-sm font-medium">About the space <span className="font-normal text-muted-foreground">(optional)</span></label>
        <Textarea id={descId} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3}
          placeholder="Walls, light, colours, how the space is used" />
      </div>
      <ActionButton type="submit" className="mt-6 w-full" disabled={create.isPending}>
        {create.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}Make board
      </ActionButton>
    </form>
  );
}
