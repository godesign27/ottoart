import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addBusinessDays, blockReason, composeOutreachEmail, DEFAULT_TEMPLATES, firstNameOf, followUpDueAt, isFollowUpDue,
  mergeTemplate, normalizeCategory, OPT_OUT_LINE, outreachHtml, parseCsv, parseSheetDate, prospectsFromCsv, weekOf,
} from "./outreach";

const values = { first_name: "Ana", company: "Acme", board_link: "https://ottoart.app/for/acme-1a2b", category_line: "Leasing helps." };

test("merge fields fill in and report what is missing or unknown", () => {
  assert.equal(mergeTemplate("Hi {{first_name}} at {{ company }}", values).text, "Hi Ana at Acme");
  const r = mergeTemplate("Hi {{first_name}}, {{nickname}}", { first_name: "  " });
  assert.deepEqual(r.missing, ["first_name"]);
  assert.deepEqual(r.unknown, ["nickname"]);
  assert.equal(r.text, "Hi {{first_name}}, {{nickname}}", "nothing is blanked out");
});

test("a draft with an empty first name is blocked, never sent as 'Hi ,'", () => {
  const out = composeOutreachEmail({ ...DEFAULT_TEMPLATES[1], values: { ...values, first_name: "" }, postalAddress: "1 Main St, Boulder, CO 80302" });
  assert.ok(out.problems.some((p) => p.includes("{{first_name}}")));
});

test("the footer is always added, with the postal address and the opt-out line", () => {
  const out = composeOutreachEmail({ subject: "Hello {{company}}", body: "Hi {{first_name}}", values, postalAddress: "1 Main St\nBoulder, CO 80302" });
  assert.deepEqual(out.problems, []);
  assert.ok(out.text.endsWith(`Otto Artwork · 1 Main St, Boulder, CO 80302\n${OPT_OUT_LINE}`));
  assert.equal(out.subject, "Hello Acme");
});

test("without a postal address nothing can be drafted", () => {
  const out = composeOutreachEmail({ subject: "Hi", body: "Hi", values, postalAddress: "  " });
  assert.ok(out.problems.some((p) => p.includes("postal address")));
});

test("a subject is always one line", () => {
  const out = composeOutreachEmail({ subject: "Art for {{company}}", body: "x", values: { ...values, company: "Acme\r\nBcc: x@y.z" }, postalAddress: "A" });
  assert.doesNotMatch(out.subject, /[\r\n]/);
});

test("both seeded templates merge cleanly with every field filled", () => {
  for (const step of [1, 2] as const) {
    const out = composeOutreachEmail({ ...DEFAULT_TEMPLATES[step], values: { ...values, featured_work: "Aspen Light, 30 × 40 in" }, postalAddress: "A" });
    assert.deepEqual(out.problems, [], `step ${step}`);
    assert.doesNotMatch(out.text, /\{\{/);
  }
});

test("the HTML version escapes text and links the board", () => {
  const html = outreachHtml("Hi <b>&\nSee https://ottoart.app/for/acme-1.\n\nBye");
  assert.match(html, /&lt;b&gt;&amp;<br>/);
  assert.match(html, /<a href="https:\/\/ottoart.app\/for\/acme-1">/);
  assert.equal((html.match(/<p>/g) ?? []).length, 2);
});

test("first names skip titles", () => {
  assert.equal(firstNameOf("Dr. Ana Ruiz"), "Ana");
  assert.equal(firstNameOf("  "), "");
  assert.equal(firstNameOf(null), "");
});

test("business days skip weekends", () => {
  const fri = new Date("2026-11-27T15:00:00Z");
  assert.equal(addBusinessDays(fri, 1).toISOString().slice(0, 10), "2026-11-30");
  assert.equal(addBusinessDays(fri, 5).toISOString().slice(0, 10), "2026-12-04");
  assert.equal(addBusinessDays(new Date("2026-11-30T12:00:00Z"), 5).toISOString().slice(0, 10), "2026-12-07");
});

test("the follow-up is due 5 business days after Email 1, only while there's no reply or opt-out", () => {
  const sent = "2026-11-30T16:00:00Z"; // Monday
  const base = { status: "email1_sent", step1SentAt: sent };
  assert.equal(followUpDueAt(base)!.toISOString(), "2026-12-07T16:00:00.000Z");
  assert.equal(isFollowUpDue(base, new Date("2026-12-07T15:59:00Z")), false);
  assert.equal(isFollowUpDue(base, new Date("2026-12-07T16:00:00Z")), true);
  for (const status of ["replied", "meeting", "won", "lost", "opted_out"]) {
    assert.equal(isFollowUpDue({ ...base, status }, new Date("2027-01-01")), false, status);
  }
  assert.equal(isFollowUpDue({ ...base, optedOutAt: "2026-12-01" }, new Date("2027-01-01")), false);
  assert.equal(isFollowUpDue({ ...base, step2DraftedOrSent: true }, new Date("2027-01-01")), false);
  assert.equal(isFollowUpDue({ status: "not_contacted" }, new Date("2027-01-01")), false);
});

test("opting out blocks every draft and send", () => {
  const later = new Date("2027-01-01");
  const seq = { step1SentAt: "2026-11-30T16:00:00Z" };
  assert.match(blockReason({ status: "opted_out", email: "a@b.co" }, 1, {})!, /opted out/);
  assert.match(blockReason({ status: "email1_sent", optedOutAt: "2026-12-01", email: "a@b.co" }, 2, seq, { now: later, early: true })!, /opted out/);
  assert.equal(blockReason({ status: "email1_sent", email: "a@b.co" }, 2, seq, { now: later }), null);
});

test("drafts need an email, and the follow-up needs Email 1 sent and the wait over", () => {
  assert.match(blockReason({ status: "not_contacted", email: "" }, 1, {})!, /email/);
  assert.match(blockReason({ status: "not_contacted", email: "a@b.co" }, 2, {})!, /hasn't been sent/);
  const seq = { step1SentAt: "2026-11-30T16:00:00Z" };
  assert.match(blockReason({ status: "email1_sent", email: "a@b.co" }, 2, seq, { now: new Date("2026-12-02") })!, /isn't due/);
  assert.equal(blockReason({ status: "email1_sent", email: "a@b.co" }, 2, seq, { now: new Date("2026-12-02"), early: true }), null);
});

test("weeks start on Monday", () => {
  assert.equal(weekOf(new Date("2026-11-25T12:00:00Z")), "2026-11-23");
  assert.equal(weekOf(new Date("2026-11-29T12:00:00Z")), "2026-11-23");
  assert.equal(weekOf(new Date("2026-11-30T12:00:00Z")), "2026-11-30");
});

test("spreadsheet dates in each format the sheet can save", () => {
  assert.equal(parseSheetDate("46356"), "2026-11-30");
  assert.equal(parseSheetDate("11/30/2026"), "2026-11-30");
  assert.equal(parseSheetDate("2026-11-30"), "2026-11-30");
  assert.equal(parseSheetDate("2/30/2026"), null);
  assert.equal(parseSheetDate("soon"), null);
});

test("CSV parsing handles quotes, commas, line breaks and a BOM", () => {
  assert.deepEqual(parseCsv('﻿a,b\r\n"x, y","say ""hi""\nthere"\n\n'), [["a", "b"], ["x, y", 'say "hi"\nthere']]);
});

test("the outreach spreadsheet's Targets sheet imports as it is", () => {
  const csv = [
    "Week,Week of,Category,Organization,Why they fit / hook,Location,Contact name,Contact email,Status,Email 1 sent,Follow-up due,Notes",
    '1,46356,Healthcare,"Boulder Health, Inc.",Calm waiting rooms,"Boulder, CO",,,Not contacted,,,',
    "1,46356,Real Estate,Pearl Lofts,New lobby,,Ana Ruiz,ana@pearl.co,,,,",
    "1,46356,Bakeries,Bread Co,,,,,,,,",
    "1,46356,Hospitality,Hotel X,,,Sam,not-an-email,,,,",
    ",,,,,,,,,,,",
  ].join("\n");
  const r = prospectsFromCsv(csv);
  assert.equal(r.prospects.length, 2);
  assert.deepEqual(r.prospects[0], {
    company: "Boulder Health, Inc.", category: "Healthcare & Wellness", hook: "Calm waiting rooms", city: "Boulder, CO",
    plannedWeek: "2026-11-30", status: "not_contacted",
  });
  assert.equal(r.prospects[1].category, "Real Estate / Property");
  assert.equal(r.prospects[1].email, "ana@pearl.co");
  assert.deepEqual(r.errors.map((e) => e.line), [4, 5]);
  assert.deepEqual(r.ignoredColumns, ["Week", "Email 1 sent", "Follow-up due"]);
});

test("categories accept the brief's names and the sheet's short ones", () => {
  assert.equal(normalizeCategory("healthcare"), "Healthcare & Wellness");
  assert.equal(normalizeCategory("Corporate Office"), "Corporate Office");
  assert.equal(normalizeCategory("Bakery"), null);
});
