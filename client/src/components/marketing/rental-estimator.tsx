import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { artSrc } from "./art";
import { ActionButton, Frame, SectionTitle } from "./primitives";
import type { RentalArtwork } from "@/hooks/use-rental-artworks";
import {
  CUSTOM_QUOTE_FROM, MAX_ARTWORK_COUNT, MONTHLY_RATE_BPS, RENTAL_PRICING_VERSION, RENTAL_TERMS, formatCents, parseDollarsToCents,
  quoteUniform, type RentalArtworkType, type RentalQuote, type RentalTerm,
} from "@shared/rentalPricing";

export interface EstimateHandoff {
  type: RentalArtworkType;
  term: RentalTerm;
  count: number;
  referenceValueCents: number;
  artworkName?: string;
  /** Present for a priced estimate, absent for the 31+ custom state. */
  monthlyCents?: number;
  termCents?: number;
  discountBps?: number;
  version: string;
}

type Result =
  | { kind: "priced"; q: RentalQuote; input: EstimateHandoff }
  | { kind: "custom"; input: EstimateHandoff }
  | null;

// The live thing: pick one of Otto's real works (or type an average value) and read the rent as an itemised slip.
export function RentalEstimator({ artworks, picked, onRequestQuote }: {
  artworks: RentalArtwork[];
  picked: { id: string; at: number } | null;
  onRequestQuote: (h: EstimateHandoff) => void;
}) {
  const ids = { title: "estimator-title", help: useId(), count: useId(), value: useId(), result: useId() };
  const [basis, setBasis] = useState<"work" | "average">("work");
  const [workId, setWorkId] = useState<string>("");
  const [type, setType] = useState<RentalArtworkType>("original");
  const [term, setTerm] = useState<RentalTerm>(6);
  const [count, setCount] = useState("1");
  const [average, setAverage] = useState("");
  const [errors, setErrors] = useState<{ count?: string; value?: string }>({});
  const [result, setResult] = useState<Result>(null);
  const slipRef = useRef<HTMLDivElement>(null);

  const hasWorks = artworks.length > 0;
  const effectiveBasis = hasWorks ? basis : "average";
  const work = artworks.find((a) => a.id === workId) ?? null;

  useEffect(() => {
    if (!workId && artworks[0]) setWorkId(artworks[0].id);
  }, [artworks, workId]);

  // A work chosen elsewhere on the page ("see rental prices for…") is selected and priced at once.
  useEffect(() => {
    if (!picked) return;
    setBasis("work");
    setWorkId(picked.id);
    const art = artworks.find((a) => a.id === picked.id);
    if (art) calculate({ basisOverride: "work", artOverride: art });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked?.at]);

  // Any change makes the last result stale: clear it rather than show numbers for other inputs.
  const touch = <T,>(set: (v: T) => void) => (v: T) => { set(v); setResult(null); };

  function calculate(opts: { basisOverride?: "work" | "average"; artOverride?: RentalArtwork } = {}) {
    const useBasis = opts.basisOverride ?? effectiveBasis;
    const next: typeof errors = {};
    const n = /^\d+$/.test(count.trim()) ? Number(count.trim()) : NaN;
    if (!Number.isInteger(n) || n < 1 || n > MAX_ARTWORK_COUNT) next.count = "Enter a whole number of artworks, from 1.";
    let value: number | null = null;
    let artworkName: string | undefined;
    if (useBasis === "work") {
      const art = opts.artOverride ?? work;
      if (!art) next.value = "Choose a work.";
      else { value = art.originalValueCents; artworkName = art.name; }
    } else {
      value = parseDollarsToCents(average);
      if (value === null) next.value = "Enter the average original retail value in US dollars, for example 2,000.";
    }
    setErrors(next);
    if (next.count || next.value || value === null) { setResult(null); return; }

    const input: EstimateHandoff = { type, term, count: n, referenceValueCents: value, artworkName, version: RENTAL_PRICING_VERSION };
    if (n >= CUSTOM_QUOTE_FROM) { setResult({ kind: "custom", input }); return; }
    const q = quoteUniform(type, term, n, value) as RentalQuote;
    setResult({ kind: "priced", q, input: { ...input, monthlyCents: q.monthlySubtotalCents, termCents: q.termSubtotalCents, discountBps: q.discountBps } });
  }

  const rate = MONTHLY_RATE_BPS[type][term] / 100;

  return (
    <Frame className="grid gap-12 py-24 md:py-32 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-6">
        <SectionTitle id={ids.title} className="text-ink-foreground">Estimate your rental fees</SectionTitle>
        <p id={ids.help} data-reveal style={{ ["--reveal-i" as string]: 1 }} className="mt-6 max-w-[54ch] text-lg leading-relaxed text-ink-foreground/90">
          Use an original artwork’s retail value to explore an illustrative rental cost. For a print, enter the retail value of the
          corresponding original. Your final quote will use the values of the artworks selected.
        </p>

        <form
          className="mt-10 flex flex-col gap-8"
          noValidate
          onSubmit={(e) => { e.preventDefault(); calculate(); }}
          aria-describedby={ids.help}
        >
          {hasWorks && (
            <Segmented
              legend="Price from"
              value={effectiveBasis}
              onChange={touch(setBasis)}
              options={[{ value: "work", label: "One of Otto’s works" }, { value: "average", label: "An average value" }]}
            />
          )}

          {effectiveBasis === "work" ? (
            <fieldset className="min-w-0">
              <legend className="mb-3 text-base font-semibold">Work</legend>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Choose a work">
                {artworks.slice(0, 12).map((art) => {
                  const on = art.id === workId;
                  return (
                    <label key={art.id} className={cn(
                      "group min-w-0 cursor-pointer p-2 transition-colors duration-200",
                      on ? "bg-ink-foreground text-ink" : "bg-white/5 text-ink-foreground hover:bg-white/10",
                    )}>
                      <input
                        type="radio"
                        name="estimator-work"
                        value={art.id}
                        checked={on}
                        onChange={() => touch(setWorkId)(art.id)}
                        className="sr-only"
                      />
                      <span className={cn("grid aspect-square place-items-center bg-white", "group-has-[:focus-visible]:outline group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-ink-foreground")}>
                        <img src={artSrc(art.studio, 160)} alt="" width={96} height={96} loading="lazy" className="h-[84%] w-[84%] object-contain" />
                      </span>
                      <span className="mt-2 block truncate text-sm font-medium">{art.name}</span>
                      <span className="tabular block text-sm opacity-75">{formatCents(art.originalValueCents).replace(".00", "")}</span>
                    </label>
                  );
                })}
              </div>
              {errors.value && <p className="mt-2 text-sm font-medium text-[hsl(336_85%_80%)]" role="alert">{errors.value}</p>}
            </fieldset>
          ) : (
            <div>
              <label htmlFor={ids.value} className="block text-base font-semibold">Average original retail value per artwork (USD)</label>
              <p id={`${ids.value}-help`} className="mt-1 text-sm text-ink-foreground/80">
                Use an average only for an illustration. For prints, use the average retail value of the corresponding originals.
              </p>
              <div className="mt-3 flex h-12 max-w-xs items-center bg-white text-ink">
                <span aria-hidden className="pl-4 pr-1 text-lg">$</span>
                <input
                  id={ids.value}
                  inputMode="decimal"
                  autoComplete="off"
                  value={average}
                  onChange={(e) => touch(setAverage)(e.target.value)}
                  aria-invalid={!!errors.value}
                  aria-describedby={`${ids.value}-help${errors.value ? ` ${ids.value}-err` : ""}`}
                  className="tabular h-full w-full bg-transparent pr-4 text-lg outline-none"
                  placeholder="2,000"
                />
              </div>
              {errors.value && <p id={`${ids.value}-err`} className="mt-2 text-sm font-medium text-[hsl(336_85%_80%)]">{errors.value}</p>}
            </div>
          )}

          <div className="grid gap-8 sm:grid-cols-2">
            <Segmented legend="Artwork type" value={type} onChange={touch(setType)}
              options={[{ value: "original", label: "Original" }, { value: "print", label: "Print" }]} />
            <Segmented legend="Term" value={String(term)} onChange={(v) => touch(setTerm)(Number(v) as RentalTerm)}
              options={RENTAL_TERMS.map((t) => ({ value: String(t), label: `${t} months` }))} />
          </div>

          <div>
            <label htmlFor={ids.count} className="block text-base font-semibold">Number of artworks</label>
            <input
              id={ids.count}
              inputMode="numeric"
              value={count}
              onChange={(e) => touch(setCount)(e.target.value)}
              aria-invalid={!!errors.count}
              aria-describedby={errors.count ? `${ids.count}-err` : undefined}
              className="tabular mt-3 h-12 w-32 bg-white px-4 text-lg text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-foreground"
            />
            {errors.count && <p id={`${ids.count}-err`} className="mt-2 text-sm font-medium text-[hsl(336_85%_80%)]">{errors.count}</p>}
          </div>

          <div>
            <ActionButton type="submit" variant="paper" data-testid="button-calculate-estimate">Calculate estimate</ActionButton>
          </div>
          {type === "print" && effectiveBasis === "work" && (
            <p className="text-sm text-ink-foreground/80">Print rent uses this work’s original retail value, not the print’s price.</p>
          )}
        </form>
      </div>

      <div className="lg:col-span-5 lg:col-start-8">
        <div
          ref={slipRef}
          id={ids.result}
          aria-live="polite"
          className="receipt-slip bg-card px-7 pb-12 pt-8 text-card-foreground lg:sticky lg:top-24"
          data-testid="estimate-slip"
        >
          <p className="text-center text-lg font-bold">Illustrative estimate</p>
          <p className="mt-1 text-center text-sm text-muted-foreground">Rental fees only · pricing {RENTAL_PRICING_VERSION}</p>
          <Slip result={result} rate={rate} onRequestQuote={onRequestQuote} />
        </div>
      </div>
    </Frame>
  );
}

function Slip({ result, rate, onRequestQuote }: { result: Result; rate: number; onRequestQuote: (h: EstimateHandoff) => void }) {
  if (!result) {
    return (
      <p className="mt-10 pb-4 text-center text-base leading-relaxed text-muted-foreground">
        Choose a work or enter a value, then calculate.
      </p>
    );
  }
  if (result.kind === "custom") {
    return (
      <div className="mt-8">
        <p className="text-xl font-semibold">Planning for 31 or more artworks?</p>
        <p className="mt-2 leading-relaxed">Tell us about your collection and we’ll prepare a custom quote.</p>
        <ActionButton type="button" className="mt-6 w-full" onClick={() => onRequestQuote(result.input)}>Request a custom quote</ActionButton>
      </div>
    );
  }
  const { q, input } = result;
  const row = "flex items-baseline justify-between gap-4 py-[7px]";
  return (
    <div className="tabular mt-8 text-base">
      <div className={row}>
        <span>{input.count} × {input.type === "original" ? "Original" : "Print"}{input.artworkName ? `, ${input.artworkName}` : ""}</span>
      </div>
      <div className={row}>
        <span className="text-muted-foreground">{input.artworkName ? "Original retail value" : "Assumed average original value"}</span>
        <span>{formatCents(input.referenceValueCents)}</span>
      </div>
      <div className={row}>
        <span className="text-muted-foreground">Rate, {input.term} months</span>
        <span>{rate}% per month</span>
      </div>
      <div className={row}>
        <span className="text-muted-foreground">Base monthly</span>
        <span>{formatCents(q.baseMonthlyCents)}</span>
      </div>
      <div className={row}>
        <span className="text-muted-foreground">Collection discount ({q.discountBps / 100}%)</span>
        <span>−{formatCents(q.discountMonthlyCents)}</span>
      </div>
      <div className="my-4 h-1 bg-foreground" />
      <div className={row}>
        <span className="font-semibold">Estimated monthly rental fees</span>
      </div>
      <p className="text-right font-display text-[2.75rem] leading-none" data-testid="estimate-monthly">{formatCents(q.monthlySubtotalCents)}</p>
      <div className={cn(row, "mt-4")}>
        <span className="font-semibold">Rental fees over {input.term} months</span>
        <span className="text-xl font-semibold" data-testid="estimate-term">{formatCents(q.termSubtotalCents)}</span>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        Estimate only. Other charges are excluded. Artwork availability and final terms are confirmed in a written quote.
      </p>
      <ActionButton type="button" className="mt-6 w-full" onClick={() => onRequestQuote(input)} data-testid="button-quote-from-estimate">
        Request a quote for this estimate
      </ActionButton>
    </div>
  );
}

function Segmented<T extends string>({ legend, value, onChange, options }: {
  legend: string; value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }>;
}) {
  const name = useId();
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-base font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <label key={o.value} className={cn(
              "cursor-pointer px-4 py-3 text-base font-medium transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink-foreground",
              on ? "bg-ink-foreground text-ink" : "bg-white/10 text-ink-foreground hover:bg-white/20",
            )}>
              <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
