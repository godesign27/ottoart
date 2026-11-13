import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

// The list a visitor last looked at (Originals filtered to Animal, say), in the order they saw it,
// so Previous and Next on an artwork walk that same list and Back returns to it.
const KEY = "ottoart:browse-trail";

interface Trail {
  ids: string[];
  from: string;
}

export function saveTrail(ids: string[], from: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ids, from } satisfies Trail));
  } catch {
    // Storage can be blocked (private mode); Next then falls back to the whole shop.
  }
}

function readTrail(): Trail | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    const trail = raw ? (JSON.parse(raw) as Trail) : null;
    return trail && Array.isArray(trail.ids) && typeof trail.from === "string" ? trail : null;
  } catch {
    return null;
  }
}

export interface Neighbours {
  previous?: Pick<Product, "id" | "name">;
  next?: Pick<Product, "id" | "name">;
  position: number;
  total: number;
  backTo: string;
}

/** Where this artwork sits in the list the visitor came from; without one, all live works, newest first. */
export function useNeighbours(productId: string | undefined): Neighbours | null {
  const { data: all = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { category: undefined, printOnly: false }],
    queryFn: async () => (await apiRequest("GET", "/api/products")).json(),
  });
  if (!productId || !all.length) return null;

  const byId = new Map(all.map((p) => [p.id, p]));
  const trail = readTrail();
  const fromTrail = trail?.ids.includes(productId) ? trail.ids.filter((id) => byId.has(id)) : null;
  const ids =
    fromTrail ??
    all
      .filter((p) => p.status === "active")
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .map((p) => p.id);

  const index = ids.indexOf(productId);
  if (index === -1 || ids.length < 2) return null;
  const pick = (id?: string) => {
    const p = id ? byId.get(id) : undefined;
    return p ? { id: p.id, name: p.name } : undefined;
  };
  return {
    previous: pick(ids[index - 1]),
    next: pick(ids[index + 1]),
    position: index + 1,
    total: ids.length,
    backTo: fromTrail && trail ? trail.from : "/shop-all",
  };
}
