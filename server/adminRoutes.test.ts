import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Every route must be on this list of deliberately public ones, or carry a login check.
// A new route that forgets its check fails here.
const PUBLIC = new Set([
  "get /api/subscription-plans", "get /api/subscription-plans/slug/:slug", "get /api/subscription-plans/:id",
  "get /api/products", "get /api/products/gallery", "get /api/products/:id", "get /api/categories", "get /api/tags",
  "post /api/orders", "post /api/messages", "get /api/gallery", "get /api/gallery/:id",
  "get /api/events/published", "get /api/events/featured", "get /api/events/:id", "post /api/commissions",
  "get /api/page-settings", "get /api/page-settings/:page", "get /api/bio-settings", "get /api/contact-settings",
  "get /api/social-settings", "get /api/site-settings", "get /api/site-settings/:key",
  "get /api/cart", "post /api/cart", "delete /api/cart/:id", "patch /api/cart/:id", "delete /api/cart",
  "post /api/newsletter-subscription", "post /api/create-payment-intent",
  "get /public-objects/:filePath(*)", "get /objects/:objectPath(*)",
  "get /api/room-backgrounds", "get /api/room-backgrounds/:id", "get /api/art-wall-simulations", "get /api/art-wall-simulations/:id",
  "post /api/stripe-webhook", "post /api/rental-inquiries", "get /api/boards/public/:slug", "post /api/boards/public/:slug/star",
  "get /api/boards/public/:slug/stars", "get /api/pos/:codeId", "post /api/pos/send-receipt", "post /api/pos/:codeId/payment-intent",
]);

const source = readFileSync(new URL("./routes.ts", import.meta.url), "utf8");
const routes = [...source.matchAll(/app\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"],\s*(\w+)?/g)]
  .map((m) => ({ id: `${m[1]} ${m[2]}`, guard: m[3] }));

test("every route is either deliberately public or checks the login", () => {
  assert.ok(routes.length > 100, "the routes were found");
  const open = routes.filter((r) => r.guard !== "requireAdmin" && r.guard !== "requireAuth" && !PUBLIC.has(r.id));
  assert.deepEqual(open.map((r) => r.id), []);
});

test("nothing on the public list has lost its reason to be public", () => {
  const ids = new Set(routes.map((r) => r.id));
  assert.deepEqual([...PUBLIC].filter((id) => !ids.has(id)), []);
});

test("changing the catalog or reading customers needs an admin", () => {
  for (const id of ["post /api/products", "put /api/products/:id", "delete /api/products/:id", "post /api/products/:id/duplicate",
    "get /api/orders", "patch /api/orders/:id", "get /api/messages", "get /api/mailing-list", "get /api/commissions", "get /api/rental-inquiries", "patch /api/rental-inquiries/:id",
    "post /api/objects/upload", "put /api/objects/finalize", "get /api/user-subscriptions/all", "post /api/subscription-plans"]) {
    assert.equal(routes.find((r) => r.id === id)?.guard, "requireAdmin", id);
  }
});

test("the shared upload key is gone", () => {
  assert.doesNotMatch(source, /admin-key|ADMIN_API_KEY/);
  for (const file of ["../client/src/components/ui/image-uploader.tsx", "../client/src/components/admin/pages/events-manager.tsx"]) {
    assert.doesNotMatch(readFileSync(new URL(file, import.meta.url), "utf8"), /admin-key/);
  }
});

test("the role check refuses anyone but an admin", async () => {
  process.env.DATABASE_URL ||= "postgres://nobody@127.0.0.1:1/none";   // never connected to: the check reads req.dbUser
  const { adminOnly } = await import("./middlewares/requireAuth");
  const run = (role?: string) => {
    let status = 0, passed = false;
    const res: any = { status(code: number) { status = code; return this; }, json() { return this; } };
    adminOnly({ dbUser: role ? { role } : undefined } as any, res, () => { passed = true; });
    return { status, passed };
  };
  assert.deepEqual(run("admin"), { status: 0, passed: true });
  assert.deepEqual(run("user"), { status: 403, passed: false });
  assert.deepEqual(run(undefined), { status: 403, passed: false });
});
