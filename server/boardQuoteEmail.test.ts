import assert from "node:assert/strict";
import { test } from "node:test";
import { boardQuoteNotification } from "./boardQuoteEmail";
import { boardSlug } from "@shared/buyerBoards";

const base = {
  boardName: "Lobby\r\nBcc: x@evil.test", intent: "rent" as const, location: "Boulder, CO",
  buyerName: "Ada <b>Lovelace</b>", buyerEmail: "ada@example.com",
  items: [{ name: "Overwritten", dimensions: "30\"x30\"", note: "<script>alert(1)</script>" }],
  adminUrl: "https://ottoart.app/admin/boards/abc",
};

test("the subject stays on one line", () => {
  const mail = boardQuoteNotification(base);
  assert.doesNotMatch(mail.subject, /[\r\n]/);
  assert.match(mail.subject, /1 artwork\)/);
});

test("buyer-typed text is escaped", () => {
  const { html } = boardQuoteNotification(base);
  assert.doesNotMatch(html, /<script>|<b>Lovelace/);
  assert.match(html, /&lt;script&gt;/);
});

test("replies go to the buyer, and no email means no reply-to", () => {
  assert.equal(boardQuoteNotification(base).replyTo, "ada@example.com");
  assert.equal(boardQuoteNotification({ ...base, buyerEmail: null }).replyTo, undefined);
});

test("board slugs are readable and carry the random part", () => {
  assert.equal(boardSlug("Lobby & 3rd floor!", "a1b2c3"), "lobby-3rd-floor-a1b2c3");
  assert.equal(boardSlug("???", "ff"), "board-ff");
});
