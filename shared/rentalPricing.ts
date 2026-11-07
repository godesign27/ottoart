// The one source of truth for art rental pricing (owner-approved rates, PRD section 3).
// The pricing table, the estimator, the inquiry form and the server all read from here, so they can never disagree.
// Money is handled in whole cents with BigInt arithmetic: no binary floating point touches a billed amount.

export const RENTAL_PRICING_VERSION = "2026-11-07.1";
export const RENTAL_CURRENCY = "USD";

export type RentalArtworkType = "original" | "print";
export type RentalTerm = 3 | 6 | 12;

export const RENTAL_TERMS: readonly RentalTerm[] = [3, 6, 12];

// Monthly rate as basis points (1/100 of a percent) of the corresponding ORIGINAL's retail value.
// A print is priced from its original's value, never the print's own price.
export const MONTHLY_RATE_BPS: Record<RentalArtworkType, Record<RentalTerm, number>> = {
  original: { 3: 1500, 6: 1200, 12: 900 },
  print: { 3: 500, 6: 400, 12: 300 },
};

// Whole-collection tiers: originals and prints count together, one discount applies to every rental fee.
export const COLLECTION_TIERS = [
  { min: 1, max: 10, discountBps: 0 },
  { min: 11, max: 20, discountBps: 1000 },
  { min: 21, max: 30, discountBps: 1500 },
] as const;
export const CUSTOM_QUOTE_FROM = 31;

// Validation limits, not claims about capacity.
export const MAX_ARTWORK_COUNT = 10_000;
export const MAX_REFERENCE_VALUE_CENTS = 10_000_000 * 100;

export function monthlyRatePercent(type: RentalArtworkType, term: RentalTerm): number {
  return MONTHLY_RATE_BPS[type][term] / 100;
}

export function termTotalPercent(type: RentalArtworkType, term: RentalTerm): number {
  return (MONTHLY_RATE_BPS[type][term] * term) / 100;
}

/** Discount for a collection size, or "custom" from 31 artworks. Throws on a count that isn't a whole number ≥ 1. */
export function collectionDiscountBps(count: number): number | "custom" {
  if (!Number.isInteger(count) || count < 1) throw new RangeError("Artwork count must be a whole number of 1 or more");
  if (count >= CUSTOM_QUOTE_FROM) return "custom";
  return COLLECTION_TIERS.find((t) => count >= t.min && count <= t.max)!.discountBps;
}

export interface RentalLine {
  type: RentalArtworkType;
  /** The corresponding original's retail value, in cents. */
  referenceValueCents: number;
}

export interface RentalQuote {
  status: "priced";
  version: string;
  term: RentalTerm;
  count: number;
  discountBps: number;
  baseMonthlyCents: number;
  discountMonthlyCents: number;
  monthlySubtotalCents: number;
  termSubtotalCents: number;
  /** Each line's share of the monthly subtotal; always sums exactly to monthlySubtotalCents. */
  lineMonthlyCents: number[];
}

export interface CustomQuote {
  status: "custom";
  version: string;
  term: RentalTerm;
  count: number;
}

// BigInt constants (written with BigInt() because the TypeScript target predates `123n` literals).
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const BPS = BigInt(10_000);
const BPS2 = BigInt(100_000_000);

// Round a non-negative rational (num/den) to whole cents, half up.
function roundHalfUp(num: bigint, den: bigint): bigint {
  return (num * TWO + den) / (den * TWO);
}

function checkLine(line: RentalLine) {
  const v = line.referenceValueCents;
  if (!Number.isSafeInteger(v) || v <= 0 || v > MAX_REFERENCE_VALUE_CENTS) {
    throw new RangeError("Each artwork needs a positive reference value in whole cents");
  }
  if (line.type !== "original" && line.type !== "print") throw new RangeError("Unknown artwork type");
}

/**
 * Price one collection: one contract, one start date, one term.
 * monthlySubtotal = round(sum(value × rate) × (1 − discount)); termSubtotal = monthlySubtotal × term.
 */
export function quoteCollection(lines: RentalLine[], term: RentalTerm): RentalQuote | CustomQuote {
  if (!RENTAL_TERMS.includes(term)) throw new RangeError("Term must be 3, 6 or 12 months");
  if (lines.length > MAX_ARTWORK_COUNT) throw new RangeError("Too many artworks");
  const discount = collectionDiscountBps(lines.length);
  if (discount === "custom") return { status: "custom", version: RENTAL_PRICING_VERSION, term, count: lines.length };
  lines.forEach(checkLine);

  // Exact amounts in units of cents/10,000 (value cents × basis points).
  const exact = lines.map((l) => BigInt(l.referenceValueCents) * BigInt(MONTHLY_RATE_BPS[l.type][term]));
  const exactSum = exact.reduce((a, b) => a + b, ZERO);
  const keep = BigInt(10_000 - discount);
  const baseMonthly = roundHalfUp(exactSum, BPS);
  const monthly = roundHalfUp(exactSum * keep, BPS2);

  // Allocate the rounded subtotal across lines (largest remainder), so line items add up to the total.
  const shares = exact.map((e) => e * keep);
  const floors = shares.map((s) => s / BPS2);
  let left = monthly - floors.reduce((a, b) => a + b, ZERO);
  const order = shares
    .map((s, i) => ({ i, rem: s % BPS2 }))
    .sort((a, b) => (b.rem === a.rem ? a.i - b.i : b.rem > a.rem ? 1 : -1));
  for (const { i } of order) {
    if (left <= ZERO) break;
    floors[i] += ONE;
    left -= ONE;
  }

  return {
    status: "priced",
    version: RENTAL_PRICING_VERSION,
    term,
    count: lines.length,
    discountBps: discount,
    baseMonthlyCents: Number(baseMonthly),
    discountMonthlyCents: Number(baseMonthly - monthly),
    monthlySubtotalCents: Number(monthly),
    termSubtotalCents: Number(monthly * BigInt(term)),
    lineMonthlyCents: floors.map(Number),
  };
}

/** The estimator's case: `count` artworks of one type, each with the same (average) reference value. */
export function quoteUniform(type: RentalArtworkType, term: RentalTerm, count: number, referenceValueCents: number) {
  if (!Number.isInteger(count) || count < 1 || count > MAX_ARTWORK_COUNT) {
    throw new RangeError("Artwork count must be a whole number between 1 and 10,000");
  }
  if (count >= CUSTOM_QUOTE_FROM) return { status: "custom", version: RENTAL_PRICING_VERSION, term, count } as CustomQuote;
  return quoteCollection(Array.from({ length: count }, () => ({ type, referenceValueCents })), term);
}

/** Parse a typed dollar amount ("2,000", "$1999.99") into cents, or null if it isn't a valid positive amount. */
export function parseDollarsToCents(input: string): number | null {
  const s = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_REFERENCE_VALUE_CENTS) return null;
  return cents;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: RENTAL_CURRENCY, minimumFractionDigits: 2 });
const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: RENTAL_CURRENCY, maximumFractionDigits: 0 });

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

/** Whole dollars when the amount has no cents ("$2,000"), otherwise two decimals. */
export function formatCentsShort(cents: number): string {
  return cents % 100 === 0 ? usdWhole.format(cents / 100) : usd.format(cents / 100);
}
