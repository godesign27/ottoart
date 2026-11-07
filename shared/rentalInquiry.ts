// The rental inquiry form's fields and rules, shared by the page (instant feedback) and the server (the real check).
import { z } from "zod";
import { MAX_ARTWORK_COUNT, RENTAL_TERMS, type RentalArtworkType, type RentalTerm } from "./rentalPricing";

export const RENTAL_INQUIRY_MESSAGES = {
  name: "Enter your name.",
  email: "Enter a valid email address.",
  location: "Enter your project’s city, region, and country.",
  choose: "Choose an option, or select ‘Not sure.’",
  count: "Enter a whole number of artworks, or choose ‘Not sure.’",
  startDate: "Choose today or a later date.",
  tooLong: "This is too long. Please shorten it.",
  summary: "Please check the highlighted fields.",
  failed: "Your inquiry wasn’t sent. Your details are still here—please try again.",
  rateLimited: "There have been several attempts. Please wait a moment and try again.",
} as const;

export const SPACE_TYPES = ["Office", "Hospitality", "Residential", "Interior design project", "Other"] as const;
export const ARTWORK_INTERESTS = [
  { value: "originals", label: "Originals" },
  { value: "prints", label: "Prints" },
  { value: "both", label: "Both" },
  { value: "not-sure", label: "Not sure" },
] as const;
export const PREFERRED_TERMS = [
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
  { value: "not-sure", label: "Not sure" },
] as const;

// Business timezone for "no past start dates". Assumed Chicago; change here if Otto Art is elsewhere.
export const BUSINESS_TIMEZONE = "America/Chicago";

export function todayInBusinessTimezone(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

const M = RENTAL_INQUIRY_MESSAGES;
const optionalText = (max: number) =>
  z.string().trim().max(max, M.tooLong).optional().transform((v) => (v ? v : undefined));

export const estimateInputSchema = z.object({
  type: z.enum(["original", "print"]),
  term: z.union([z.literal(3), z.literal(6), z.literal(12)]),
  count: z.number().int().min(1).max(MAX_ARTWORK_COUNT),
  referenceValueCents: z.number().int().positive(),
  artworkName: z.string().max(200).optional(),
});
export type EstimateInput = { type: RentalArtworkType; term: RentalTerm; count: number; referenceValueCents: number; artworkName?: string };

export const rentalInquirySchema = z.object({
  name: z.string({ required_error: M.name }).trim().min(1, M.name).max(120, M.tooLong),
  email: z.string({ required_error: M.email }).trim().max(254, M.email).email(M.email),
  company: optionalText(200),
  phone: optionalText(40),
  location: z.string({ required_error: M.location }).trim().min(2, M.location).max(200, M.tooLong),
  spaceType: z.enum(SPACE_TYPES).optional().or(z.literal("").transform(() => undefined)),
  artworkInterest: z.enum(["originals", "prints", "both", "not-sure"], { errorMap: () => ({ message: M.choose }) }),
  artworkCount: z.union([
    z.literal("not-sure"),
    z.string().trim().regex(/^\d+$/, M.count).transform(Number).pipe(z.number().int().min(1, M.count).max(MAX_ARTWORK_COUNT, M.count)),
  ], { errorMap: () => ({ message: M.count }) }),
  preferredTerm: z.enum(["3", "6", "12", "not-sure"], { errorMap: () => ({ message: M.choose }) }),
  preferredStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("").transform(() => undefined))
    .refine((d) => !d || d >= todayInBusinessTimezone(), M.startDate),
  details: optionalText(3000),
  estimate: estimateInputSchema.optional().nullable(),
  idempotencyKey: z.string().min(8).max(100),
  website: z.string().max(500).optional(), // honeypot: hidden from people, so only bots fill it in
});

export type RentalInquiryInput = z.input<typeof rentalInquirySchema>;

/** Field errors keyed by field name, first message only. */
export function inquiryFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function isRentalTerm(n: number): n is RentalTerm {
  return (RENTAL_TERMS as readonly number[]).includes(n);
}
