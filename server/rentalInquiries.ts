import type { Request, Response } from "express";
import { randomInt } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { rentalInquiries } from "@shared/schema";
import { inquiryFieldErrors, rentalInquirySchema, RENTAL_INQUIRY_MESSAGES } from "@shared/rentalInquiry";
import { quoteUniform, RENTAL_PRICING_VERSION } from "@shared/rentalPricing";

// A few submissions per visitor in a short window; enough for honest retries, not for a flood.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const attempts = new Map<string, number[]>();

function rateLimited(ip: string, now = Date.now()): boolean {
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 5000) attempts.clear(); // keep memory bounded
  return recent.length > MAX_PER_WINDOW;
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I/L
function newReference(): string {
  return "R-" + Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

function sameOrigin(req: Request): boolean {
  const origin = req.get("origin");
  if (!origin) return true; // same-origin form posts from older browsers omit it
  try {
    return new URL(origin).host === req.get("host");
  } catch {
    return false;
  }
}

export async function createRentalInquiry(req: Request, res: Response) {
  if (!sameOrigin(req)) return res.status(403).json({ message: RENTAL_INQUIRY_MESSAGES.failed });
  if (rateLimited(req.ip || "unknown")) {
    return res.status(429).json({ message: RENTAL_INQUIRY_MESSAGES.rateLimited });
  }

  const parsed = rentalInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: RENTAL_INQUIRY_MESSAGES.summary, errors: inquiryFieldErrors(parsed.error) });
  }
  const input = parsed.data;

  // Honeypot filled in: answer like a success so bots learn nothing, store nothing.
  if (input.website) return res.status(201).json({ reference: newReference() });

  // Recalculate the illustrative estimate here; the browser's numbers are never trusted.
  let estimate: Record<string, unknown> | null = null;
  if (input.estimate) {
    const e = input.estimate;
    try {
      const q = quoteUniform(e.type, e.term, e.count, e.referenceValueCents);
      estimate = { ...e, pricingVersion: RENTAL_PRICING_VERSION, result: q, illustrative: true };
    } catch {
      estimate = { ...e, pricingVersion: RENTAL_PRICING_VERSION, result: null, note: "Inputs out of range" };
    }
  }

  try {
    const [row] = await db.insert(rentalInquiries).values({
      reference: newReference(),
      idempotencyKey: input.idempotencyKey,
      name: input.name,
      email: input.email,
      company: input.company,
      phone: input.phone,
      location: input.location,
      spaceType: input.spaceType,
      artworkInterest: input.artworkInterest,
      artworkCount: input.artworkCount === "not-sure" ? null : input.artworkCount,
      preferredTerm: input.preferredTerm,
      preferredStartDate: input.preferredStartDate,
      details: input.details,
      estimate,
      sourceRoute: "/art-rental-leasing",
    }).onConflictDoNothing({ target: rentalInquiries.idempotencyKey }).returning({ reference: rentalInquiries.reference });

    if (row) return res.status(201).json({ reference: row.reference });
    // Same form sent twice (double click, retry after a lost response): return the first one's reference.
    const [existing] = await db.select({ reference: rentalInquiries.reference }).from(rentalInquiries)
      .where(eq(rentalInquiries.idempotencyKey, input.idempotencyKey)).limit(1);
    if (existing) return res.status(200).json({ reference: existing.reference });
    throw new Error("Inquiry was neither saved nor found");
  } catch (error) {
    console.error("Rental inquiry not saved:", (error as Error).message); // no personal details in logs
    return res.status(503).json({ message: RENTAL_INQUIRY_MESSAGES.failed });
  }
}

export async function listRentalInquiries(_req: Request, res: Response) {
  const rows = await db.select().from(rentalInquiries).orderBy(desc(rentalInquiries.createdAt)).limit(500);
  res.json(rows);
}

export async function updateRentalInquiry(req: Request, res: Response) {
  const status = typeof req.body?.status === "string" ? req.body.status : undefined;
  const isRead = typeof req.body?.isRead === "boolean" ? req.body.isRead : undefined;
  if (status && !["new", "contacted", "quoted", "closed"].includes(status)) {
    return res.status(400).json({ message: "Unknown status" });
  }
  const [row] = await db.update(rentalInquiries)
    .set({ ...(status ? { status } : {}), ...(isRead !== undefined ? { isRead } : {}) })
    .where(eq(rentalInquiries.id, req.params.id)).returning();
  if (!row) return res.status(404).json({ message: "Inquiry not found" });
  res.json(row);
}
