import { z } from "zod";

// What a signed-in buyer can send when making and managing their own boards. Shared by the server and the forms.

const trimmed = (max: number) => z.string().trim().max(max);

export const createBuyerBoardSchema = z.object({
  name: trimmed(80).min(1, "Give the board a name"),
  description: trimmed(500).optional().nullable(),
  /** Optionally put a first artwork on the new board (from "Save to board > New board"). */
  productId: z.string().min(1).max(64).optional(),
});

export const updateBuyerBoardSchema = z.object({
  name: trimmed(80).min(1, "Give the board a name").optional(),
  description: trimmed(500).optional().nullable(),
  /** true: anyone with the link can view it and star their picks. */
  shared: z.boolean().optional(),
}).strict();

export const addBoardItemSchema = z.object({ productId: z.string().min(1).max(64) });

export const updateBoardItemSchema = z.object({ note: trimmed(500).nullable() }).strict();

export const QUOTE_INTENTS = {
  rent: "Rent or lease",
  buy: "Buy",
  "not-sure": "Not sure yet",
} as const;

export const boardQuoteSchema = z.object({
  intent: z.enum(["rent", "buy", "not-sure"]),
  location: trimmed(120).min(1, "Tell us the city or address the art is for"),
  timing: trimmed(80).optional().nullable(),
  phone: trimmed(40).optional().nullable(),
  message: trimmed(2000).optional().nullable(),
});

export type BoardQuote = z.infer<typeof boardQuoteSchema>;

/** A board's private-link slug: readable name plus random characters so it can't be guessed. */
export function boardSlug(name: string, random: string) {
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return `${base || "board"}-${random}`;
}
