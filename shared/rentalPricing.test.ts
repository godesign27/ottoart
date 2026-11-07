import { test } from "node:test";
import assert from "node:assert/strict";
import {
  collectionDiscountBps, parseDollarsToCents, quoteCollection, quoteUniform, termTotalPercent, type RentalQuote,
} from "./rentalPricing";

const priced = (q: ReturnType<typeof quoteCollection>) => {
  assert.equal(q.status, "priced");
  return q as RentalQuote;
};

test("all six rate and term combinations match the agreed table", () => {
  assert.equal(termTotalPercent("original", 3), 45);
  assert.equal(termTotalPercent("original", 6), 72);
  assert.equal(termTotalPercent("original", 12), 108);
  assert.equal(termTotalPercent("print", 3), 15);
  assert.equal(termTotalPercent("print", 6), 24);
  assert.equal(termTotalPercent("print", 12), 36);
});

test("one $2,000 artwork gives every worked example", () => {
  const cases: Array<["original" | "print", 3 | 6 | 12, number, number]> = [
    ["original", 3, 30000, 90000], ["original", 6, 24000, 144000], ["original", 12, 18000, 216000],
    ["print", 3, 10000, 30000], ["print", 6, 8000, 48000], ["print", 12, 6000, 72000],
  ];
  for (const [type, term, monthly, total] of cases) {
    const q = priced(quoteUniform(type, term, 1, 200000));
    assert.equal(q.monthlySubtotalCents, monthly, `${type} ${term} monthly`);
    assert.equal(q.termSubtotalCents, total, `${type} ${term} total`);
  }
});

test("tier boundaries: 1/10 → 0%, 11/20 → 10%, 21/30 → 15%, 31+ → custom", () => {
  assert.equal(collectionDiscountBps(1), 0);
  assert.equal(collectionDiscountBps(10), 0);
  assert.equal(collectionDiscountBps(11), 1000);
  assert.equal(collectionDiscountBps(20), 1000);
  assert.equal(collectionDiscountBps(21), 1500);
  assert.equal(collectionDiscountBps(30), 1500);
  assert.equal(collectionDiscountBps(31), "custom");
  assert.equal(quoteUniform("print", 6, 31, 200000).status, "custom");
  assert.equal(quoteUniform("original", 12, 10_000, 200000).status, "custom");
});

test("twelve $2,000 prints for 6 months: $864.00 a month, $5,184.00 in total", () => {
  const q = priced(quoteUniform("print", 6, 12, 200000));
  assert.equal(q.baseMonthlyCents, 96000);
  assert.equal(q.discountMonthlyCents, 9600);
  assert.equal(q.monthlySubtotalCents, 86400);
  assert.equal(q.termSubtotalCents, 518400);
});

test("one original and ten prints for 3 months: $1,170.00 a month, $3,510.00 in total", () => {
  const lines = [{ type: "original" as const, referenceValueCents: 200000 },
    ...Array.from({ length: 10 }, () => ({ type: "print" as const, referenceValueCents: 200000 }))];
  const q = priced(quoteCollection(lines, 3));
  assert.equal(q.monthlySubtotalCents, 117000);
  assert.equal(q.termSubtotalCents, 351000);
});

test("fractional cents round once and line items add up to the collection subtotal", () => {
  // 13 prints at $333.33 for 12 months: 13 × 33333 × 3% = 12999.87 cents, less 10% = 11699.883 → 11700
  const q = priced(quoteUniform("print", 12, 13, 33333));
  assert.equal(q.monthlySubtotalCents, 11700);
  assert.equal(q.lineMonthlyCents.reduce((a, b) => a + b, 0), q.monthlySubtotalCents);
  const mixed = priced(quoteCollection([
    { type: "original", referenceValueCents: 99999 },
    { type: "print", referenceValueCents: 123457 },
    { type: "print", referenceValueCents: 1 },
  ], 6));
  assert.equal(mixed.lineMonthlyCents.reduce((a, b) => a + b, 0), mixed.monthlySubtotalCents);
});

test("blank, zero, negative or malformed input never produces a price", () => {
  for (const bad of ["", "0", "-5", "abc", "1.999", "1e5", "$", "10000000.01"]) {
    assert.equal(parseDollarsToCents(bad), null, `"${bad}"`);
  }
  assert.equal(parseDollarsToCents("$2,000"), 200000);
  assert.equal(parseDollarsToCents("1999.9"), 199990);
  assert.throws(() => quoteUniform("original", 6, 0, 200000));
  assert.throws(() => quoteUniform("original", 6, 2.5, 200000));
  assert.throws(() => quoteUniform("original", 6, 1, 0));
  assert.throws(() => quoteUniform("original", 6, 1, Number.NaN));
  assert.throws(() => quoteCollection([{ type: "original", referenceValueCents: 100 }], 9 as 3));
});
