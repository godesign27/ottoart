import assert from "node:assert/strict";
import test from "node:test";
import { apiRequest } from "./queryClient";

test("checkout sends the same stored cart session as cart requests", async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const requests: { url: string; headers: Record<string, string> }[] = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => "regression-test-cart", setItem: () => {} },
  });
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), headers: init?.headers as Record<string, string> });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  try {
    await apiRequest("POST", "/api/cart", { productId: "test-product" });
    await apiRequest("POST", "/api/create-payment-intent", { customerInfo: {} });
    await apiRequest("POST", "/api/orders", {});
    assert.equal(requests[0].headers["x-cart-session"], "regression-test-cart");
    assert.equal(requests[1].headers["x-cart-session"], requests[0].headers["x-cart-session"]);
    assert.equal(requests[1].headers["Content-Type"], "application/json");
    assert.equal(requests[2].headers["x-cart-session"], undefined);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
