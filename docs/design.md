# Otto Art design system

The rules for how ottoart.app looks, reads and behaves. Read this before building or restyling a page.
Tokens live in `client/src/index.css` (`:root` and `.dark`) and are exposed to Tailwind in `tailwind.config.ts`.
Shared marketing building blocks live in `client/src/components/marketing/`.

## Principles (in priority order)

When two principles conflict, the higher one wins.

1. **The artwork is the colour.**
   The interface stays quiet (warm white, near-black, one accent) so Otto's work is the loudest thing on the page.
   - *Do:* put artwork on calm surfaces with generous space around it.
   - *Don't:* add gradients, coloured section backgrounds or decorative illustrations that compete with the work.
   - *Trade-off:* pages can feel restrained. Let the images carry the energy.
2. **Say what it costs, then what it includes.**
   Prices, terms and limits are shown plainly, next to the thing they describe, never in a footnote.
   - *Do:* show the full-term total next to every monthly price.
   - *Don't:* use "affordable", "save", "risk-free" or anything else we can't back with a specific comparison.
3. **Never claim what we can't show.**
   No invented testimonials, client logos, response times, service areas, materials or guarantees. If a fact isn't
   verified, the copy describes it as something confirmed in the quote or agreement.
4. **One clear next step per section.**
   Each section ends with at most one primary action. Secondary actions are outline or text buttons.
5. **Works for everyone, everywhere.**
   - Keyboard: everything reachable, with a visible focus ring.
   - Contrast: WCAG 2.2 AA.
   - Width: holds up at 320px, and at 200% zoom.
   - Motion: honours reduced-motion settings.

## Light first

The site is designed in light mode and opens in light mode for everyone (it does not follow the device setting).
A sun/moon button in the header switches to dark mode, remembered per browser. Every page must still work in dark
mode, but no section is designed as a dark block: no black heroes, black form panels or black closing bands.

## Colour

Use the semantic tokens, never raw hex or Tailwind palette colours (`blue-600`, `gray-50`) in new work.

| Token (Tailwind) | Use for |
|---|---|
| `background` / `foreground` | Page surface and body text (warm white / near-black) |
| `card` | Raised surfaces: cards, tables, form panels |
| `muted`, `muted-foreground` | Quiet bands and secondary text (meets 4.5:1 on `background` and `card`) |
| `primary` | Primary buttons and key UI (near-black; inverts in dark mode) |
| `brand`, `brand-soft` | The one accent (pink from the artwork). The closing call-to-action tile, an open FAQ answer, a list marker. Never body text or a whole section |
| `ink`, `ink-foreground` | Reserved. Don't use for whole sections (see "Light first") |
| `border`, `input`, `ring` | Hairlines, field outlines, focus rings |
| `destructive` | Errors and destructive actions only |

- Opacity modifiers work on every token (`bg-primary/10`, `text-foreground/55`): `tailwind.config.ts` maps tokens through `color-mix`.
- Tile fields on marketing pages rotate through stone `hsl(38 22% 90%)`, pink `hsl(336 60% 93%)`, pale teal `hsl(188 28% 88%)` and white — colours taken from the artwork. No yellow-cream grounds.
- Colour never carries meaning alone: pair it with text or an icon.
- Status badges in the admin keep their own colours (amber Draft, etc.).

## Typography

| Role | Font | Tailwind |
|---|---|---|
| Display: H1, H2 on marketing pages | Playfair Display | `font-display` |
| Everything else | Inter | `font-sans` (default) |

| Style | Classes |
|---|---|
| H1 (hero) | `font-display text-[2.75rem] md:text-[4.5rem] xl:text-[5.5rem] leading-[0.98] tracking-[-0.03em]` |
| H2 (section) | `SectionTitle` — `font-display text-[2.25rem] md:text-[3.25rem] leading-[1.05]` |
| H3 | `text-lg font-semibold` (Inter) |
| Lead | `text-lg md:text-xl text-muted-foreground leading-relaxed` |
| Body | `text-base leading-relaxed`, max line length about 65 characters (`max-w-prose` / `max-w-2xl`) |
| Small print | `text-sm text-muted-foreground` (never below 12px) |

- One H1 per page, and headings never skip a level. Every heading fits in two lines at every width.
- About five sizes per page: display, heading, lead (20–24px), body (16–18px), small (14px). Nothing readable under 13px.
- Use `text-balance` on headings so they don't leave a single word on the last line.

## Space and layout

- **Page width:** `max-w-6xl` (72rem) for content, and `max-w-3xl` for long reading.
  - Gutters: `px-4` on phones, `sm:px-6`, `lg:px-8`.
- **Section rhythm:** `py-20 md:py-28`. Alternate `background` and `muted/40` bands to separate sections, without adding colour.
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96px (Tailwind 1, 2, 3, 4, 6, 8, 12, 16, 24).
- **Radius:** square, everywhere. `--radius` is 0, so buttons, inputs, menus, cards, badges, product images and tiles in the shop, marketing pages and admin all have square corners. Round shapes stay only where the shape means something (avatars, radio dots, switches, count badges).
- **Product cards** (`components/live-site/product-grid.tsx`): no box or shadow. A 4:5 image on a stone ground, then name, size · medium, and one price line ("Original $3,227 · Prints from $250"), then status badges. Images load at card size through `artSrc`.
- **Shadows:** none on anything at rest. Only things that float (menus, dialogs, a fixed notice) get one.
- **Lines:** none as decoration. Separate with space or a tone step. Lines belong only in real tables and form fields.
- **Anchored sections** use `scroll-mt-24` so the sticky header doesn't cover their heading.

## Components

### Building blocks

Use these first. All in `client/src/components/marketing/` unless noted.

| Component | File | Notes |
|---|---|---|
| `ActionLink`, `ActionButton` | `primitives.tsx` | Square, 48px tall. Variants: `solid` (near-black), `paper` (on ink/brand), `quiet` and `quietInk` (tone step, never an outline) |
| `Frame` | `primitives.tsx` | The page's one pair of margins (`max-w-[90rem]`, 16/24/40px gutters) |
| `SectionTitle` | `primitives.tsx` | Section H2 in the display face, with an entrance |
| `MarketingHero` | `hero.tsx` | The first screen: breadcrumb, H1, lead, body and actions on the light ground (left), one large room picture running to the screen edge (right). `wide` gives a longer headline half the width. On a phone the words and actions come first |
| `FaqTiles` | `faq.tsx` | Questions as filled tiles; native `details`, one open at a time; open tile turns brand pink |
| `RentalEstimator` | `rental-estimator.tsx` | Pick a real work (or an average value) and read an itemised receipt slip |
| `RentalInquiryForm` | `rental-inquiry-form.tsx` | The clip-out coupon form: visible labels, error summary, honest failure states |
| `PageUnavailable`, `AdminOffNotice` | `page-unavailable.tsx` | Switched-off pages |
| `artSrc`, `artSrcSet` | `art.ts` | Sized image URLs: uploaded images resize on the server with `?w=` (160–1600), so a thumbnail never loads a 2 MB original |
| `useReveal` | `hooks/use-reveal.ts` | Entrances for `data-reveal` elements; stagger with `--reveal-i` |
| `usePageAccess` | `hooks/use-page-access.ts` | On/off switch logic for a page |

Section patterns already in use (pick a different one for neighbouring sections):
- **Statement with inline thumbnails** — a large paragraph with small room images set inside the line.
- **Frame run, one lifted** — real works at their natural proportions, one shown larger.
- **Tables** — semantic `<table>` with a caption, for numbers people compare.
- **Tiles that grow** — numbered process as an `<ol>` of colour tiles that get taller step by step.
- **Index with preview** — large row titles; pointing at one dims the rest and swaps a picture.
- **Action tile row** — a closing call to action on a brand tile, flanked by a picture and an ink tile, cropped by the screen edges.

**Never:** small labels above headings, tiny spaced-out capitals, rows of icon-topped cards, gradients, glass panels, emoji, a styled accent word inside a headline, or more than two typefaces.

### shadcn/ui primitives

Use these for buttons, inputs, selects, radio groups, tables and so on: `client/src/components/ui/`.

**Buttons:** on marketing pages use `ActionLink`/`ActionButton` (above). In the shop and admin, use the shadcn `Button`. Both are square, with the same near-black primary fill and a tone-step secondary.

**Forms:**
- Visible label above every field; never placeholder-only.
- Required fields are marked in text ("required"), not just with an asterisk.
- Errors sit under the field (`text-destructive`, with `aria-describedby`), plus an error summary that gets focus on submit.
- Never clear what someone typed after an error.

## Motion

- Hover and press: 150–200ms with `var(--ease-out)`. Panels: 200–300ms.
- Section entrances (`data-reveal`): fade and rise 24px, staggered 80ms, once. Put them on headings and text, not on big pictures or colour fields, so nothing large sits blank while waiting.
- Everything turns off under `prefers-reduced-motion` (a global rule in `index.css`).
- No looping background animation behind text.

## Copy

- Plain, warm and specific. Write in second person ("your space"), and talk about Otto in the third person or as "we" consistently within a page.
- Buttons name the outcome: "Request a rental quote", not "Submit".
- Errors say what happened and what to do, and keep the visitor's work.
- Banned without evidence: "affordable", "cheaper than buying", "save money", "risk-free", "museum-quality", "archival",
  "nationwide", response-time promises, testimonials, client names.

## Images

- Use real Otto Art work only, and never label a print as an original.
- If an image is a staged room visualisation, add a visible caption saying so.
- Always set width and height (or an aspect ratio) to avoid layout shift.
- Lazy-load anything below the first screen.
- Alt text names the work and its setting. Decorative images get `alt=""`.

## Page on/off switches

Marketing pages that can be switched off use the `page_settings` table:
- Add the page key to `pageSettings.page` in `shared/schema.ts`.
- Add an admin page under Pages in `components/admin/sidebar.tsx`.
- Show its footer and More-menu links only when it is enabled.
- Render `PageUnavailable` for non-admin visitors while it is off.

A page with no saved setting counts as on.
