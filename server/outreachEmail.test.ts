import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { buildOutreachMime, toGmailRaw } from "./outreachEmail";
import { decryptToken, encryptToken, signState, tokenKey, verifyState } from "./outreachCrypto";

const part = (mime: string, type: string) => {
  const m = mime.split("\r\n--").find((p) => p.includes(`Content-Type: ${type}`))!;
  return Buffer.from(m.split("\r\n\r\n")[1].replace(/\r\n/g, ""), "base64").toString("utf8");
};

test("the message has one-line headers and both text and HTML parts", () => {
  const mime = buildOutreachMime({ to: { email: "ana@pearl.co", name: "Ana Ruiz" }, subject: "Art for\r\nBcc: x@evil.co", text: "Hi Ana\nhttps://ottoart.app/for/a-1" }, "B");
  const head = mime.split("\r\n\r\n")[0];
  assert.match(head, /^To: "Ana Ruiz" <ana@pearl.co>$/m);
  assert.match(head, /^Subject: Art for Bcc: x@evil.co$/m);
  assert.doesNotMatch(head, /^Bcc:/m);
  assert.doesNotMatch(head, /In-Reply-To/);
  assert.equal(part(mime, "text/plain"), "Hi Ana\r\nhttps://ottoart.app/for/a-1");
  assert.match(part(mime, "text/html"), /<a href="https:\/\/ottoart.app\/for\/a-1">/);
});

test("non-ASCII subjects and names are encoded", () => {
  const mime = buildOutreachMime({ to: { email: "a@b.co", name: "Zoë" }, subject: "Art · Boulder", text: "x" }, "B");
  assert.match(mime, /^Subject: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/m);
  assert.match(mime, /^To: =\?UTF-8\?B\?.+\?= <a@b.co>$/m);
});

test("the follow-up replies in the same thread", () => {
  const mime = buildOutreachMime({ to: { email: "a@b.co" }, subject: "Re: Art", text: "x", inReplyTo: "<abc@mail.gmail.com>" }, "B");
  assert.match(mime, /^In-Reply-To: <abc@mail.gmail.com>$/m);
  assert.match(mime, /^References: <abc@mail.gmail.com>$/m);
  assert.throws(() => buildOutreachMime({ to: { email: "a@b.co" }, subject: "x", text: "x", inReplyTo: "abc\r\nBcc: y" }));
});

test("a bad recipient is refused", () => {
  assert.throws(() => buildOutreachMime({ to: { email: "a@b.co\r\nBcc: x@y.z" }, subject: "x", text: "x" }));
});

test("the raw value is base64url", () => {
  const raw = toGmailRaw(buildOutreachMime({ to: { email: "a@b.co" }, subject: "x", text: "ü?>" }, "B"));
  assert.match(raw, /^[A-Za-z0-9_-]+$/);
});

test("the refresh token is encrypted, and tampering or a wrong key fails", () => {
  const key = randomBytes(32);
  const sealed = encryptToken("1//refresh-token", key);
  assert.doesNotMatch(sealed, /refresh-token/);
  assert.equal(decryptToken(sealed, key), "1//refresh-token");
  assert.throws(() => decryptToken(sealed, randomBytes(32)));
  const flipped = sealed.slice(0, -2) + (sealed.endsWith("A") ? "B" : "A") + sealed.slice(-1);
  assert.throws(() => decryptToken(flipped, key));
});

test("the key must be 32 bytes of base64", () => {
  assert.equal(tokenKey({ OUTREACH_TOKEN_KEY: randomBytes(32).toString("base64") } as any)?.length, 32);
  assert.equal(tokenKey({ OUTREACH_TOKEN_KEY: "short" } as any), null);
  assert.equal(tokenKey({} as any), null);
});

test("the OAuth state is signed and expires", () => {
  const key = randomBytes(32);
  const state = signState("nonce-1", key, 1_000);
  assert.equal(verifyState(state, key, 2_000), "nonce-1");
  assert.equal(verifyState(state, key, 1_000 + 11 * 60 * 1000), null);
  assert.equal(verifyState(state, randomBytes(32), 2_000), null);
  assert.equal(verifyState(state.replace(/.$/, "x"), key, 2_000), null);
  assert.equal(verifyState("garbage", key), null);
});
