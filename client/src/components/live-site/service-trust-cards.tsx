// The promises behind every order, set as three plain columns on a quiet band: no icons, no card boxes.
// Rules: docs/design.md.
export function ServiceTrustCards() {
  const cards = [
    {
      title: "Certificate of Authenticity",
      content: ["Every original artwork includes a signed certificate guaranteeing authenticity and providing full provenance details."],
    },
    {
      title: "Secure Checkout",
      content: [
        "Shop with Confidence. Your payment details are safeguarded by bank-level encryption throughout the checkout process.",
        "We accept all major credit cards, plus modern options like Link and Amazon Pay, so you can choose the method that works best for you.",
      ],
    },
    {
      title: "Shipping & Delivery",
      content: [
        "Free US delivery for qualifying orders. Your artwork is hand-packed with care and shipped in professional packaging. Every order comes with a tracking number emailed directly to you for peace of mind.",
        "US delivery: within 14 days. International delivery: 14–28 days.",
      ],
    },
  ];

  return (
    <section aria-labelledby="peace-of-mind" className="bg-secondary">
      <div className="mx-auto w-full max-w-[90rem] px-4 py-20 sm:px-6 md:py-24 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <h2 id="peace-of-mind" className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.02em] text-foreground md:text-[3rem] lg:col-span-4">
            Peace of mind, every step
          </h2>
          <div className="grid gap-10 md:grid-cols-3 lg:col-span-8">
            {cards.map((card) => (
              <div key={card.title} data-testid={`service-card-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                {card.content.map((para) => (
                  <p key={para} className="mt-3 text-base leading-relaxed text-foreground/80">{para}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
