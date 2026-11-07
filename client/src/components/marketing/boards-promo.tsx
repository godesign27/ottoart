import { ActionLink, Frame, SectionTitle } from "./primitives";

// "Plan it on a board": the way into buyer boards from the Corporate Buyers and Art Rental pages.
const steps = [
  { title: "Gather", body: "Open any work and choose Save to board. Keep a board per room, floor or site." },
  { title: "Note", body: "Add a note to each piece: which wall, which size, original or print." },
  { title: "Share", body: "Turn on the share link so colleagues can star their picks, no account needed." },
  { title: "Send", body: "Send the board to Otto with your location and timing, and get a quote by email." },
];

export function BoardsPromo({ id = "boards-title", className = "" }: { id?: string; className?: string }) {
  return (
    <section aria-labelledby={id} className={`py-24 md:py-32 ${className}`} data-testid="boards-promo">
      <Frame className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionTitle id={id} className="max-w-[14ch]">Plan it on a board</SectionTitle>
          <p data-reveal className="mt-6 max-w-[44ch] text-lg leading-relaxed">
            Choosing art for a space is rarely one person's call. A board keeps the shortlist, the notes and everyone's picks in one place.
          </p>
          <div className="mt-8"><ActionLink href="/boards" data-testid="link-start-board">Start a board</ActionLink></div>
        </div>
        <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-7">
          {steps.map((s, i) => (
            <li key={s.title} data-reveal style={{ ["--reveal-i" as string]: i }}>
              <p className="font-display text-[2.5rem] leading-none text-muted-foreground" aria-hidden>{i + 1}</p>
              <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </Frame>
    </section>
  );
}
