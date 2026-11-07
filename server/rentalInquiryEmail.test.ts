import { test } from "node:test";
import assert from "node:assert/strict";
import { rentalInquiryNotification } from "./rentalInquiryEmail";

const base = {
  reference: "R-ABC234", name: "Ana <script>", email: "ana@example.com", company: "Studio\r\nBcc: x@evil.test",
  location: "Boulder, CO, USA", artworkInterest: "prints", artworkCount: 12, preferredTerm: "6", details: "Lobby & two <b>halls</b>",
  estimate: { type: "print", term: 6, count: 12, referenceValueCents: 200000, pricingVersion: "v1",
    result: { status: "priced", monthlySubtotalCents: 86400, termSubtotalCents: 518400, discountBps: 1000 } },
};

test("the rental inquiry email escapes visitor text and keeps the subject on one line", () => {
  const m = rentalInquiryNotification(base, "https://ottoart.app/admin/art-rental-leasing");
  assert.equal(m.replyTo, "ana@example.com");
  assert.doesNotMatch(m.subject, /[\r\n]/);
  assert.match(m.subject, /^Art rental inquiry R-ABC234: /);
  assert.doesNotMatch(m.html, /<script>|<b>halls/);
  assert.match(m.html, /Ana &lt;script&gt;/);
  assert.match(m.html, /\$864\.00 a month, \$5,184\.00 over the term \(10% collection discount\)/);
  assert.match(m.html, /Prints/);
});

test("an inquiry with no estimate and 'not sure' answers still makes a complete email", () => {
  const m = rentalInquiryNotification({ ...base, company: null, artworkCount: null, preferredTerm: "not-sure", details: null, estimate: null }, "u");
  assert.match(m.html, /Not sure/);
  assert.doesNotMatch(m.html, /Illustrative estimate/);
  assert.equal(m.subject, "Art rental inquiry R-ABC234: Ana <script>");
});
