import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { apiRequest } from "@/lib/queryClient";
import type { BoardQuote } from "@shared/buyerBoards";

// A signed-in buyer's own boards (server/buyerBoards.ts).

export interface MyBoardSummary {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  shared: boolean;
  quoteRequestedAt: string | null;
  updatedAt: string | null;
  itemCount: number;
  productIds: string[];
  covers: string[];
}

export interface MyBoardItem {
  id: string;
  note: string | null;
  productId: string;
  product: { id: string; name: string; images: string[] | null; dimensions: string | null; medium: string | null; price: string; isSold: boolean | null; status: string | null };
  starredBy: string[];
}

export interface MyBoardDetail {
  board: MyBoardSummary & { quoteIntent: string | null; quoteDetails: Partial<BoardQuote> | null };
  items: MyBoardItem[];
}

export const MY_BOARDS = ["/api/my/boards"] as const;
export const myBoardKey = (id: string) => ["/api/my/boards", id] as const;

/** The server's own sentence from a failed request ("400: {"message":"..."}"), or a plain fallback. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Try again in a moment.") {
  const text = error instanceof Error ? error.message : "";
  const json = text.slice(text.indexOf("{"));
  try { return JSON.parse(json).message || fallback; } catch { return fallback; }
}

/** Where to send someone who isn't signed in, bringing them back here afterwards. */
export const signInHref = (back = typeof window !== "undefined" ? window.location.pathname : "/boards") =>
  `/sign-in?redirect_url=${encodeURIComponent(back)}`;

export function useMyBoards() {
  const { isSignedIn, isLoaded } = useUser();
  const query = useQuery<MyBoardSummary[]>({
    queryKey: MY_BOARDS,
    queryFn: () => apiRequest("GET", "/api/my/boards").then((r) => r.json()),
    enabled: Boolean(isSignedIn),
  });
  return { ...query, isSignedIn: Boolean(isSignedIn), authLoaded: isLoaded };
}

export function useMyBoard(id: string) {
  const { isSignedIn } = useUser();
  return useQuery<MyBoardDetail>({
    queryKey: myBoardKey(id),
    queryFn: () => apiRequest("GET", `/api/my/boards/${id}`).then((r) => r.json()),
    enabled: Boolean(isSignedIn && id),
    retry: false,
  });
}

export function useBoardMutations() {
  const qc = useQueryClient();
  const refresh = (id?: string) => {
    void qc.invalidateQueries({ queryKey: MY_BOARDS });
    if (id) void qc.invalidateQueries({ queryKey: myBoardKey(id) });
  };
  const json = (r: Response) => r.json();

  return {
    create: useMutation({
      mutationFn: (body: { name: string; description?: string | null; productId?: string }) =>
        apiRequest("POST", "/api/my/boards", body).then(json) as Promise<MyBoardSummary>,
      onSuccess: () => refresh(),
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string; name?: string; description?: string | null; shared?: boolean }) =>
        apiRequest("PATCH", `/api/my/boards/${id}`, body).then(json),
      onSuccess: (_d, v) => refresh(v.id),
    }),
    remove: useMutation({
      mutationFn: (id: string) => apiRequest("DELETE", `/api/my/boards/${id}`).then(json),
      onSuccess: () => refresh(),
    }),
    addItem: useMutation({
      mutationFn: ({ id, productId }: { id: string; productId: string }) =>
        apiRequest("POST", `/api/my/boards/${id}/items`, { productId }).then(json),
      onSuccess: (_d, v) => refresh(v.id),
    }),
    setNote: useMutation({
      mutationFn: ({ id, itemId, note }: { id: string; itemId: string; note: string | null }) =>
        apiRequest("PATCH", `/api/my/boards/${id}/items/${itemId}`, { note }).then(json),
      onSuccess: (_d, v) => refresh(v.id),
    }),
    removeItem: useMutation({
      mutationFn: ({ id, itemId }: { id: string; itemId: string }) =>
        apiRequest("DELETE", `/api/my/boards/${id}/items/${itemId}`).then(json),
      onSuccess: (_d, v) => refresh(v.id),
    }),
    quote: useMutation({
      mutationFn: ({ id, ...body }: BoardQuote & { id: string }) =>
        apiRequest("POST", `/api/my/boards/${id}/quote`, body).then(json),
      onSuccess: (_d, v) => refresh(v.id),
    }),
  };
}
