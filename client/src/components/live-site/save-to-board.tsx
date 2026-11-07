import { useId, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Check, LayoutGrid, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { errorMessage, signInHref, useBoardMutations, useMyBoards } from "@/hooks/use-my-boards";

// "Save to board" on an artwork: pick one of your boards, or start a new one with this piece on it.
export function SaveToBoard({ productId, productName, className }: { productId: string; productName: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { data: boards = [], isLoading, isSignedIn, authLoaded } = useMyBoards();
  const { create, addItem } = useBoardMutations();
  const { toast } = useToast();
  const inputId = useId();
  const errorId = useId();
  const savedCount = boards.filter((b) => b.productIds.includes(productId)).length;

  const saved = (boardName: string, boardId: string) =>
    toast({ title: `Saved to ${boardName}`, description: <Link href={`/boards/${boardId}`} className="underline underline-offset-4">Open the board</Link> });

  const addTo = (id: string, name: string) => {
    setError(null);
    addItem.mutate({ id, productId }, {
      onSuccess: () => saved(name, id),
      onError: (e) => setError(errorMessage(e)),
    });
  };

  const createBoard = (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) { setError("Give the board a name"); return; }
    setError(null);
    create.mutate({ name, productId }, {
      onSuccess: (board) => { setNewName(""); saved(board.name, board.id); },
      onError: (err) => setError(errorMessage(err)),
    });
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null); }}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="lg" className={cn("h-12 gap-2 text-base font-semibold", className)} data-testid="save-to-board" aria-label={savedCount ? `Save to board (on ${savedCount})` : "Save to board"}>
          <LayoutGrid className="h-4 w-4" aria-hidden />
          {savedCount ? `On ${savedCount === 1 ? "a board" : `${savedCount} boards`}` : "Save to board"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {!authLoaded ? null : !isSignedIn ? (
          <div className="space-y-3 p-4 text-sm">
            <p className="font-semibold">Plan a space with boards</p>
            <p className="text-muted-foreground">Gather works for a room or a whole office, add notes, share the board with colleagues and send it to Otto for a quote.</p>
            <Button asChild className="w-full"><a href={signInHref()}>Sign in to save</a></Button>
          </div>
        ) : (
          <div>
            <p className="px-4 pb-2 pt-4 text-sm font-semibold">Save {productName} to</p>
            {isLoading ? (
              <p className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading your boards</p>
            ) : boards.length > 0 && (
              <ul className="max-h-64 overflow-y-auto">
                {boards.map((b) => {
                  const on = b.productIds.includes(productId);
                  return (
                    <li key={b.id}>
                      {on ? (
                        <Link href={`/boards/${b.id}`} className="flex min-h-11 items-center justify-between gap-3 px-4 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none">
                          <span className="truncate">{b.name}</span>
                          <span className="flex shrink-0 items-center gap-1 text-muted-foreground"><Check className="h-4 w-4" aria-hidden />Saved</span>
                        </Link>
                      ) : (
                        <button type="button" onClick={() => addTo(b.id, b.name)} disabled={addItem.isPending}
                          className="flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:opacity-60">
                          <span className="truncate">{b.name}</span>
                          <span className="shrink-0 text-muted-foreground">{b.itemCount} {b.itemCount === 1 ? "work" : "works"}</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <form onSubmit={createBoard} className="space-y-2 bg-muted/50 p-4">
              <label htmlFor={inputId} className="text-sm font-medium">New board</label>
              <div className="flex gap-2">
                <Input id={inputId} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Lobby, 2nd floor" maxLength={80}
                  aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={create.isPending} aria-label="Create board and save">
                  {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                </Button>
              </div>
              {error && <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>}
            </form>
            <Link href="/boards" className="block px-4 py-3 text-sm underline-offset-4 hover:underline">All your boards</Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
