import type Stripe from "stripe";
import type { CartItem, Order, Product } from "@shared/schema";

// The application pins Stripe's existing API version. Accept period dates from
// that response shape and from newer SDKs that put them on subscription items.
export function subscriptionPeriod(subscription: Stripe.Subscription) {
  const legacy = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const item = subscription.items.data[0];
  const start = legacy.current_period_start ?? item?.current_period_start;
  const end = legacy.current_period_end ?? item?.current_period_end;
  return {
    currentPeriodStart: start == null ? null : new Date(start * 1000),
    currentPeriodEnd: end == null ? null : new Date(end * 1000),
  };
}

export function cartUnitPrice(product: Product, item: Pick<CartItem, "tierId" | "quantity">) {
  if (!Number.isInteger(item.quantity) || item.quantity < 1) {
    throw new Error("Invalid item quantity");
  }
  if (product.status !== "active") throw new Error(`Product ${product.name} is not available`);
  const tier = item.tierId ? product.pricingTiers?.find(t => t.id === item.tierId) : undefined;
  if (item.tierId && !tier) throw new Error(`Selected option for ${product.name} is no longer available`);
  // Products with selectable options must not bypass their option's price.
  if (!item.tierId && product.pricingTiers?.length) throw new Error(`Select an option for ${product.name}`);
  if (product.isSold && (!tier || tier.type.toLowerCase() === "original")) {
    throw new Error(`The original ${product.name} has been sold`);
  }
  const price = tier ? tier.price : Number(product.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error(`Invalid price for ${product.name}`);
  return price;
}

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
);

export function orderNotification(
  order: Pick<Order, "customerName" | "customerEmail" | "items" | "totalAmount" | "shippingAddress">,
  productNames: Map<string, string>,
) {
  // Both stored order totals and line prices are in major USD units, not cents.
  const total = Number(order.totalAmount).toFixed(2);
  const items = order.items.map(item =>
    `<li>${escapeHtml(productNames.get(item.productId) ?? item.productId)} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`,
  ).join("");
  const address = typeof order.shippingAddress === "object"
    ? Object.values(order.shippingAddress ?? {}).filter(Boolean).join(", ")
    : order.shippingAddress;
  return {
    subject: `New Order: $${total}`,
    html: `<h2>New Order Received!</h2>
      <p><strong>Customer:</strong> ${escapeHtml(order.customerName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(order.customerEmail)}</p>
      <h3>Items:</h3><ul>${items}</ul><p><strong>Total:</strong> $${total}</p>
      <h3>Shipping Address:</h3><p>${escapeHtml(address)}</p>
      <p><em>View this order in your admin panel.</em></p>`,
  };
}
