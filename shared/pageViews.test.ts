import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPath, deviceOf, isBot, productIdOf, referrerHost } from "./pageViews";

test("cleanPath keeps the page, drops the query and skips private pages", () => {
  assert.equal(cleanPath("/originals?type=animal#top"), "/originals");
  assert.equal(cleanPath("/"), "/");
  assert.equal(cleanPath("/bio/"), "/bio");
  assert.equal(cleanPath("/admin"), null);
  assert.equal(cleanPath("/admin/products"), null);
  assert.equal(cleanPath("/sign-in/factor-one"), null);
  assert.equal(cleanPath("/api/products"), null);
  assert.equal(cleanPath("//evil.example"), null);
  assert.equal(cleanPath("https://ottoart.app/"), null);
  assert.equal(cleanPath(42), null);
  assert.equal(cleanPath("/" + "a".repeat(250)), null);
  assert.equal(cleanPath("/administrator-bio"), "/administrator-bio");
});

test("productIdOf reads the artwork id from an artwork page only", () => {
  assert.equal(productIdOf("/product/3f2a-99"), "3f2a-99");
  assert.equal(productIdOf("/product/"), null);
  assert.equal(productIdOf("/products/3f2a"), null);
  assert.equal(productIdOf("/product/a/b"), null);
});

test("referrerHost keeps outside sites only", () => {
  assert.equal(referrerHost("https://www.instagram.com/p/xyz", "ottoart.app"), "instagram.com");
  assert.equal(referrerHost("https://ottoart.app/bio", "ottoart.app"), null);
  assert.equal(referrerHost("https://www.ottoart.app/", "ottoart.app"), null);
  assert.equal(referrerHost("http://localhost:5050/", "localhost:5050"), null);
  assert.equal(referrerHost("not a url", "ottoart.app"), null);
  assert.equal(referrerHost("", "ottoart.app"), null);
});

test("isBot and deviceOf", () => {
  assert.equal(isBot(undefined), true);
  assert.equal(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isBot("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15"), false);
  assert.equal(deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148"), "mobile");
  assert.equal(deviceOf("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"), "tablet");
  assert.equal(deviceOf("Mozilla/5.0 (Linux; Android 14; SM-X710)"), "tablet");
  assert.equal(deviceOf("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari"), "mobile");
  assert.equal(deviceOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "desktop");
});
