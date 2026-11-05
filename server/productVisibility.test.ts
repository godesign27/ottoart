import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { isDraft, withoutDrafts } from "./productVisibility";

test("the public list leaves out drafts and keeps everything else", () => {
  const rows = [{ id: "a", status: "active" }, { id: "b", status: "draft" }, { id: "c", status: "archived" }, { id: "d", status: null }];
  assert.deepEqual(withoutDrafts(rows).map((row) => row.id), ["a", "c", "d"]);
  assert.equal(isDraft({ status: "draft" }), true);
  assert.equal(isDraft({ status: "active" }), false);
});

const routes = readFileSync(new URL("./routes.ts", import.meta.url), "utf8");
const handler = (path: string) => {
  const start = routes.indexOf(`app.get("${path}"`);
  assert.ok(start >= 0, path);
  return routes.slice(start, routes.indexOf("\n  });", start));
};

test("the public product list hides drafts unless an admin asks", () => {
  const body = handler("/api/products");
  assert.match(body, /await isAdminRequest\(req\)/);
  assert.match(body, /withoutDrafts\(products\)/);
  assert.match(body, /Cache-Control/);
});

test("one draft product is not found unless an admin asks", () => {
  const body = handler("/api/products/:id");
  assert.match(body, /isDraft\(product\) && !\(await isAdminRequest\(req\)\)/);
  assert.match(body, /status\(404\)/);
  assert.match(body, /Cache-Control/);
});

test("the gallery still shows only active products", () => {
  assert.match(handler("/api/products/gallery"), /p\.status === 'active'/);
});
