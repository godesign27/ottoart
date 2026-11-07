import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "./db";
import { boardItems, boardStars, boards, products, type Board } from "@shared/schema";
import {
  addBoardItemSchema, boardQuoteSchema, boardSlug, createBuyerBoardSchema, updateBoardItemSchema, updateBuyerBoardSchema,
} from "@shared/buyerBoards";
import { boardQuoteNotification } from "./boardQuoteEmail";

// Boards that signed-in buyers (corporate and rental clients) make for themselves. Every handler runs behind
// requireAuth and only ever touches boards whose owner is the signed-in user; anyone else's board is a 404.

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "ottoart27@gmail.com";
const SITE = (process.env.SITE_URL || "https://ottoart.app").replace(/\/$/, "");
const MAX_BOARDS = 50;
const MAX_ITEMS = 200;
const QUOTE_COOLDOWN_MS = 10 * 60 * 1000;

const userOf = (req: Request) => (req as any).dbUser as { id: string; email?: string | null; firstName?: string | null; lastName?: string | null };
const fail = (res: Response, status: number, message: string) => res.status(status).json({ message });
const firstError = (issues: { message: string }[]) => issues[0]?.message ?? "Check the details and try again";

async function ownBoard(req: Request): Promise<Board | undefined> {
  const [board] = await db.select().from(boards)
    .where(and(eq(boards.id, req.params.id), eq(boards.ownerUserId, userOf(req).id)));
  return board;
}

/** The fields a buyer sees for their own board. */
const view = (b: Board) => ({
  id: b.id, name: b.name, description: b.description, slug: b.slug, shared: b.status === "active",
  quoteRequestedAt: b.quoteRequestedAt, createdAt: b.createdAt, updatedAt: b.updatedAt,
});

const touch = (id: string) => db.update(boards).set({ updatedAt: new Date() }).where(eq(boards.id, id));

async function productExists(productId: string) {
  const [p] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId));
  return Boolean(p);
}

async function addItem(boardId: string, productId: string) {
  const existing = await db.select().from(boardItems).where(eq(boardItems.boardId, boardId));
  const already = existing.find((i) => i.productId === productId);
  if (already) return { item: already, added: false };
  if (existing.length >= MAX_ITEMS) return { item: null, added: false };
  const sortOrder = existing.reduce((m, i) => Math.max(m, i.sortOrder ?? 0), -1) + 1;
  const [item] = await db.insert(boardItems).values({ boardId, productId, sortOrder }).returning();
  await touch(boardId);
  return { item, added: true };
}

export async function listMyBoards(req: Request, res: Response) {
  try {
    const mine = await db.select().from(boards).where(eq(boards.ownerUserId, userOf(req).id)).orderBy(desc(boards.updatedAt));
    const ids = mine.map((b) => b.id);
    const items = ids.length
      ? await db.select({ boardId: boardItems.boardId, productId: boardItems.productId, images: products.images, sortOrder: boardItems.sortOrder })
        .from(boardItems).innerJoin(products, eq(products.id, boardItems.productId))
        .where(inArray(boardItems.boardId, ids)).orderBy(asc(boardItems.sortOrder))
      : [];
    res.json(mine.map((b) => {
      const own = items.filter((i) => i.boardId === b.id);
      return {
        ...view(b),
        itemCount: own.length,
        productIds: own.map((i) => i.productId),
        covers: own.map((i) => (i.images as string[] | null)?.[0]).filter(Boolean).slice(0, 4),
      };
    }));
  } catch (error) {
    console.error("Error listing buyer boards:", error);
    fail(res, 500, "We couldn't load your boards. Try again in a moment.");
  }
}

export async function createMyBoard(req: Request, res: Response) {
  const parsed = createBuyerBoardSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, firstError(parsed.error.issues));
  try {
    const user = userOf(req);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(boards).where(eq(boards.ownerUserId, user.id));
    if (count >= MAX_BOARDS) return fail(res, 400, `You can have up to ${MAX_BOARDS} boards. Delete one you no longer need to make another.`);
    if (parsed.data.productId && !(await productExists(parsed.data.productId))) return fail(res, 404, "That artwork is no longer available");
    const [board] = await db.insert(boards).values({
      name: parsed.data.name,
      description: parsed.data.description || null,
      slug: boardSlug(parsed.data.name, randomBytes(6).toString("hex")),
      status: "draft",
      ownerUserId: user.id,
    }).returning();
    if (parsed.data.productId) await addItem(board.id, parsed.data.productId);
    res.status(201).json(view(board));
  } catch (error) {
    console.error("Error creating buyer board:", error);
    fail(res, 500, "We couldn't make the board. Try again in a moment.");
  }
}

export async function getMyBoard(req: Request, res: Response) {
  try {
    const board = await ownBoard(req);
    if (!board) return fail(res, 404, "Board not found");
    const items = await db.select({ item: boardItems, product: products })
      .from(boardItems).innerJoin(products, eq(products.id, boardItems.productId))
      .where(eq(boardItems.boardId, board.id)).orderBy(asc(boardItems.sortOrder), asc(boardItems.createdAt));
    const stars = await db.select({ productId: boardStars.productId, curatorName: boardStars.curatorName })
      .from(boardStars).where(eq(boardStars.boardId, board.id));
    res.json({
      board: { ...view(board), quoteIntent: board.quoteIntent, quoteDetails: board.quoteDetails },
      items: items.map(({ item, product }) => ({
        id: item.id, note: item.note, productId: item.productId,
        product: {
          id: product.id, name: product.name, images: product.images, dimensions: product.dimensions, medium: product.medium,
          price: product.price, isSold: product.isSold, status: product.status,
        },
        // Colleagues' stars: names only, never their email addresses.
        starredBy: stars.filter((s) => s.productId === item.productId).map((s) => s.curatorName),
      })),
    });
  } catch (error) {
    console.error("Error fetching buyer board:", error);
    fail(res, 500, "We couldn't load this board. Try again in a moment.");
  }
}

export async function updateMyBoard(req: Request, res: Response) {
  const parsed = updateBuyerBoardSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, firstError(parsed.error.issues));
  try {
    const board = await ownBoard(req);
    if (!board) return fail(res, 404, "Board not found");
    const { shared, ...rest } = parsed.data;
    const [updated] = await db.update(boards).set({
      ...rest,
      ...(shared === undefined ? {} : { status: shared ? "active" : "draft" }),
      updatedAt: new Date(),
    }).where(eq(boards.id, board.id)).returning();
    res.json(view(updated));
  } catch (error) {
    console.error("Error updating buyer board:", error);
    fail(res, 500, "We couldn't save that change. Try again in a moment.");
  }
}

export async function deleteMyBoard(req: Request, res: Response) {
  try {
    const board = await ownBoard(req);
    if (!board) return fail(res, 404, "Board not found");
    await db.delete(boards).where(eq(boards.id, board.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting buyer board:", error);
    fail(res, 500, "We couldn't delete the board. Try again in a moment.");
  }
}

export async function addMyBoardItem(req: Request, res: Response) {
  const parsed = addBoardItemSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "Choose an artwork to add");
  try {
    const board = await ownBoard(req);
    if (!board) return fail(res, 404, "Board not found");
    if (!(await productExists(parsed.data.productId))) return fail(res, 404, "That artwork is no longer available");
    const { item, added } = await addItem(board.id, parsed.data.productId);
    if (!item) return fail(res, 400, `A board holds up to ${MAX_ITEMS} artworks`);
    res.status(added ? 201 : 200).json(item);
  } catch (error) {
    console.error("Error adding to buyer board:", error);
    fail(res, 500, "We couldn't add that artwork. Try again in a moment.");
  }
}

async function ownItem(req: Request) {
  const board = await ownBoard(req);
  if (!board) return null;
  const [item] = await db.select().from(boardItems).where(and(eq(boardItems.id, req.params.itemId), eq(boardItems.boardId, board.id)));
  return item ? { board, item } : null;
}

export async function updateMyBoardItem(req: Request, res: Response) {
  const parsed = updateBoardItemSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, firstError(parsed.error.issues));
  try {
    const found = await ownItem(req);
    if (!found) return fail(res, 404, "Artwork not found on this board");
    const [item] = await db.update(boardItems).set({ note: parsed.data.note || null }).where(eq(boardItems.id, found.item.id)).returning();
    await touch(found.board.id);
    res.json(item);
  } catch (error) {
    console.error("Error updating buyer board note:", error);
    fail(res, 500, "We couldn't save the note. Try again in a moment.");
  }
}

export async function removeMyBoardItem(req: Request, res: Response) {
  try {
    const found = await ownItem(req);
    if (!found) return fail(res, 404, "Artwork not found on this board");
    await db.delete(boardItems).where(eq(boardItems.id, found.item.id));
    await touch(found.board.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing from buyer board:", error);
    fail(res, 500, "We couldn't remove that artwork. Try again in a moment.");
  }
}

export async function requestMyBoardQuote(req: Request, res: Response) {
  const parsed = boardQuoteSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, firstError(parsed.error.issues));
  try {
    const board = await ownBoard(req);
    if (!board) return fail(res, 404, "Board not found");
    if (board.quoteRequestedAt && Date.now() - new Date(board.quoteRequestedAt).getTime() < QUOTE_COOLDOWN_MS) {
      return fail(res, 429, "We already have this board. If something changed, wait a few minutes and send it again.");
    }
    const items = await db.select({ name: products.name, dimensions: products.dimensions, note: boardItems.note })
      .from(boardItems).innerJoin(products, eq(products.id, boardItems.productId))
      .where(eq(boardItems.boardId, board.id)).orderBy(asc(boardItems.sortOrder));
    if (items.length === 0) return fail(res, 400, "Add at least one artwork before sending the board");

    const { intent, ...details } = parsed.data;
    const [updated] = await db.update(boards)
      .set({ quoteRequestedAt: new Date(), quoteIntent: intent, quoteDetails: details, updatedAt: new Date() })
      .where(eq(boards.id, board.id)).returning();

    // The request is saved before the email, so a failed email never loses it: it's in Admin > Boards.
    if (resend) {
      const user = userOf(req);
      const mail = boardQuoteNotification({
        boardName: board.name, intent, ...details, items,
        buyerName: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
        buyerEmail: user.email ?? null,
        adminUrl: `${SITE}/admin/boards/${board.id}`,
      });
      resend.emails.send({ from: "Otto Art <hello@ottoart.app>", to: NOTIFY_EMAIL, ...mail })
        .then(({ error }) => { if (error) console.error("Board quote email not sent:", error.message); })
        .catch((err) => console.error("Board quote email not sent:", (err as Error).message));
    }
    res.json(view(updated));
  } catch (error) {
    console.error("Error sending board quote request:", error);
    fail(res, 500, "We couldn't send the board. Nothing was lost; try again in a moment.");
  }
}
