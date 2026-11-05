import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import Stripe from "stripe";
import express from "express";
import type { AddressInfo } from "node:net";
import type { Product } from "@shared/schema";
import { cartUnitPrice, orderNotification, subscriptionPeriod } from "./payment-utils";

const product = {
  name: "Artwork", price: "995.00", status: "active", isSold: false,
  pricingTiers: [
    { id: "original", price: 995, type: "Original" },
    { id: "print", price: 45, type: "Print" },
  ],
} as Product;

test("checkout prices the selected option rather than the parent product", () => {
  assert.equal(cartUnitPrice(product, { tierId: "print", quantity: 2 }), 45);
  assert.equal(cartUnitPrice(product, { tierId: "original", quantity: 1 }), 995);
});

test("checkout rejects stale or missing options and invalid quantities", () => {
  assert.throws(() => cartUnitPrice(product, { tierId: "deleted", quantity: 1 }), /no longer available/);
  assert.throws(() => cartUnitPrice(product, { tierId: null, quantity: 1 }), /Select an option/);
  for (const quantity of [0, -1, 0.5, NaN]) {
    assert.throws(() => cartUnitPrice(product, { tierId: "print", quantity }), /quantity/);
  }
  assert.throws(() => cartUnitPrice({ ...product, status: "draft" }, { tierId: "print", quantity: 1 }), /not available/);
});

test("sold originals stay unavailable while their prints remain purchasable", () => {
  const sold = { ...product, isSold: true };
  assert.throws(() => cartUnitPrice(sold, { tierId: "original", quantity: 1 }), /sold/);
  assert.equal(cartUnitPrice(sold, { tierId: "print", quantity: 1 }), 45);
});

test("products without options use the base price and reject invalid prices", () => {
  assert.equal(cartUnitPrice({ ...product, pricingTiers: [] }, { tierId: null, quantity: 1 }), 995);
  assert.throws(() => cartUnitPrice({ ...product, pricingTiers: [], price: "NaN" }, { tierId: null, quantity: 1 }), /Invalid price/);
});

test("order emails use major USD units, product names, and escaped HTML", () => {
  const result = orderNotification({
    customerName: "<script>name</script>", customerEmail: "buyer@example.com",
    totalAmount: "90.00", items: [{ productId: "p1", quantity: 2, price: 45 }],
    shippingAddress: { street: "123 Main", city: "Denver", state: "CO", zip: "80000", country: "US" },
  }, new Map([["p1", "Print & Frame"]]));
  assert.equal(result.subject, "New Order: $90.00");
  assert.match(result.html, /Print &amp; Frame x 2 - \$90\.00/);
  assert.match(result.html, /&lt;script&gt;/);
  assert.match(result.html, /123 Main, Denver/);
  assert.doesNotMatch(result.html, /\$0\.90|NaN|\[object Object\]/);
});

test("subscription periods support the pinned and newer Stripe response shapes", () => {
  const legacy = { current_period_start: 1000, current_period_end: 2000, items: { data: [] } } as unknown as Stripe.Subscription;
  const modern = { items: { data: [{ current_period_start: 1000, current_period_end: 2000 }] } } as unknown as Stripe.Subscription;
  assert.deepEqual(subscriptionPeriod(legacy), subscriptionPeriod(modern));
  assert.equal(subscriptionPeriod(legacy).currentPeriodEnd?.getTime(), 2_000_000);
  assert.deepEqual(subscriptionPeriod({ items: { data: [] } } as unknown as Stripe.Subscription), {
    currentPeriodStart: null, currentPeriodEnd: null,
  });
});

test("webhook raw payload middleware precedes the application's JSON parser", () => {
  const index = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
  const raw = index.indexOf('app.use("/api/stripe-webhook", express.raw');
  assert.ok(raw >= 0 && raw < index.indexOf("app.use(express.json())"));
});

test("Stripe signatures verify with raw middleware and reject tampered payloads", async () => {
  const sdk = new Stripe("sk_test_local_unit_test");
  const secret = "whsec_local_unit_test";
  const payload = JSON.stringify({ id: "evt_unit", type: "test.event", data: { object: {} } });
  const signature = sdk.webhooks.generateTestHeaderString({ payload, secret });
  const app = express();
  app.use("/webhook", express.raw({ type: "application/json" }));
  app.use(express.json());
  app.post("/webhook", (req, res) => {
    try {
      const event = sdk.webhooks.constructEvent(req.body, req.get("stripe-signature")!, secret);
      res.json({ id: event.id });
    } catch { res.sendStatus(400); }
  });
  const server = app.listen(0);
  try {
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/webhook`;
    const headers = { "content-type": "application/json", "stripe-signature": signature };
    assert.equal((await fetch(url, { method: "POST", headers, body: payload })).status, 200);
    assert.equal((await fetch(url, { method: "POST", headers, body: payload + " " })).status, 400);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
