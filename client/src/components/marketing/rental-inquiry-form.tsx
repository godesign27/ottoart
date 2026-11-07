import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ActionButton } from "./primitives";
import type { EstimateHandoff } from "./rental-estimator";
import {
  ARTWORK_INTERESTS, PREFERRED_TERMS, RENTAL_INQUIRY_MESSAGES as M, SPACE_TYPES, inquiryFieldErrors, rentalInquirySchema,
  todayInBusinessTimezone,
} from "@shared/rentalInquiry";
import { formatCents } from "@shared/rentalPricing";

type Values = {
  name: string; email: string; company: string; phone: string; location: string; spaceType: string;
  artworkInterest: string; countMode: "number" | "not-sure"; artworkCount: string; preferredTerm: string;
  preferredStartDate: string; details: string; website: string;
};

const EMPTY: Values = {
  name: "", email: "", company: "", phone: "", location: "", spaceType: "", artworkInterest: "", countMode: "number",
  artworkCount: "", preferredTerm: "", preferredStartDate: "", details: "", website: "",
};

const ORDER = ["name", "email", "location", "artworkInterest", "artworkCount", "preferredTerm", "preferredStartDate", "company", "phone", "details"];
const LABELS: Record<string, string> = {
  name: "Your name", email: "Email address", location: "Project location", artworkInterest: "Artwork interest",
  artworkCount: "Approximate artwork count", preferredTerm: "Preferred term", preferredStartDate: "Preferred start date",
  company: "Company / organization", phone: "Phone", details: "Project details",
};

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function RentalInquiryForm({ handoff }: { handoff: EstimateHandoff | null }) {
  const [v, setV] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [estimate, setEstimate] = useState<EstimateHandoff | null>(null);
  const [state, setState] = useState<{ kind: "idle" | "sending" | "failed" | "done"; message?: string; reference?: string }>({ kind: "idle" });
  const keyRef = useRef(newKey()); // one key per form fill: a double submit or retry saves once
  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  // Carry the estimator's inputs in, as an editable starting point.
  useEffect(() => {
    if (!handoff) return;
    setEstimate(handoff);
    setV((cur) => ({
      ...cur,
      artworkInterest: cur.artworkInterest || (handoff.type === "original" ? "originals" : "prints"),
      preferredTerm: cur.preferredTerm || String(handoff.term),
      countMode: "number",
      artworkCount: cur.artworkCount || String(handoff.count),
    }));
  }, [handoff]);

  useEffect(() => {
    if (state.kind === "done") doneRef.current?.focus();
  }, [state.kind]);

  const set = (field: keyof Values) => (value: string) => {
    started.current = true;
    setV((cur) => ({ ...cur, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  function payload() {
    return {
      name: v.name, email: v.email, company: v.company, phone: v.phone, location: v.location, spaceType: v.spaceType || undefined,
      artworkInterest: v.artworkInterest, artworkCount: v.countMode === "not-sure" ? "not-sure" : v.artworkCount,
      preferredTerm: v.preferredTerm, preferredStartDate: v.preferredStartDate, details: v.details,
      estimate: estimate ? {
        type: estimate.type, term: estimate.term, count: estimate.count,
        referenceValueCents: estimate.referenceValueCents, artworkName: estimate.artworkName,
      } : null,
      idempotencyKey: keyRef.current,
      website: v.website,
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind === "sending") return;
    const body = payload();
    const check = rentalInquirySchema.safeParse(body);
    if (!check.success) {
      setErrors(inquiryFieldErrors(check.error));
      setState({ kind: "idle" });
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setErrors({});
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/rental-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.reference) {
        setState({ kind: "done", reference: data.reference });
        return;
      }
      if (res.status === 400 && data.errors) {
        setErrors(data.errors);
        setState({ kind: "idle" });
        requestAnimationFrame(() => summaryRef.current?.focus());
        return;
      }
      setState({ kind: "failed", message: res.status === 429 ? M.rateLimited : M.failed });
    } catch {
      setState({ kind: "failed", message: M.failed });
    }
  }

  const errorList = ORDER.filter((f) => errors[f]);

  return (
    <div className="coupon grid bg-ink text-ink-foreground lg:grid-cols-[38%_62%]">
      <div className="flex flex-col justify-between gap-8 p-8 md:p-12">
        <div>
          <h2 id="inquiry-title" className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.02em] md:text-[3rem]">
            Let’s plan art for your space
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-foreground/90">
            Tell us what you’re working on. Share your location, approximate artwork count, and preferred term so we can discuss availability and prepare a quote.
          </p>
        </div>
        <p className="text-sm leading-relaxed text-ink-muted">
          This is an inquiry, not a booking or rental agreement. Please don’t include payment details or sensitive information.
          We’ll use the details you provide to respond to your inquiry.
        </p>
      </div>

      <div className="border-ink-foreground/25 bg-[hsl(30_6%_13%)] p-6 sm:p-8 md:p-12 lg:border-l-[5px] lg:border-dotted">
        {state.kind === "done" ? (
          <div ref={doneRef} tabIndex={-1} className="outline-none" data-testid="inquiry-success">
            <p className="font-display text-3xl leading-tight">Your rental inquiry has been received.</p>
            <p className="mt-4 text-lg leading-relaxed">
              Thank you for sharing your project. Otto Art will review your inquiry and follow up using the email address you provided.
            </p>
            <p className="mt-6 text-ink-muted">Reference: <span className="tabular font-semibold text-ink-foreground">{state.reference}</span></p>
          </div>
        ) : (
          <form noValidate onSubmit={submit} aria-labelledby="inquiry-title" className="grid gap-6 sm:grid-cols-2" data-testid="rental-inquiry-form">
            {errorList.length > 0 && (
              <div ref={summaryRef} tabIndex={-1} role="alert" className="bg-[hsl(336_74%_42%)] p-5 text-white outline-none sm:col-span-2" data-testid="inquiry-error-summary">
                <p className="font-semibold">{M.summary}</p>
                <ul className="mt-2 list-disc pl-5">
                  {errorList.map((f) => (
                    <li key={f}><a href={`#inquiry-${f}`} className="underline underline-offset-2">{LABELS[f]}: {errors[f]}</a></li>
                  ))}
                </ul>
              </div>
            )}

            <Field id="name" label="Your name" required error={errors.name}>
              <input id="inquiry-name" autoComplete="name" maxLength={120} value={v.name} onChange={(e) => set("name")(e.target.value)} {...aria("name", errors)} className={inputCls} />
            </Field>
            <Field id="email" label="Email address" required error={errors.email}>
              <input id="inquiry-email" type="email" autoComplete="email" maxLength={254} value={v.email} onChange={(e) => set("email")(e.target.value)} {...aria("email", errors)} className={inputCls} />
            </Field>
            <Field id="company" label="Company / organization" error={errors.company}>
              <input id="inquiry-company" autoComplete="organization" maxLength={200} value={v.company} onChange={(e) => set("company")(e.target.value)} {...aria("company", errors)} className={inputCls} />
            </Field>
            <Field id="phone" label="Phone" error={errors.phone}>
              <input id="inquiry-phone" type="tel" autoComplete="tel" maxLength={40} value={v.phone} onChange={(e) => set("phone")(e.target.value)} {...aria("phone", errors)} className={inputCls} />
            </Field>
            <Field id="location" label="Project location" hint="City, state/region, and country" required error={errors.location} wide>
              <input id="inquiry-location" autoComplete="address-level2" maxLength={200} value={v.location} onChange={(e) => set("location")(e.target.value)} {...aria("location", errors, true)} className={inputCls} />
            </Field>
            <Field id="spaceType" label="Space type" error={errors.spaceType}>
              <select id="inquiry-spaceType" value={v.spaceType} onChange={(e) => set("spaceType")(e.target.value)} className={inputCls}>
                <option value="">Choose…</option>
                {SPACE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field id="preferredStartDate" label="Preferred start date" error={errors.preferredStartDate}>
              <input id="inquiry-preferredStartDate" type="date" min={todayInBusinessTimezone()} value={v.preferredStartDate} onChange={(e) => set("preferredStartDate")(e.target.value)} {...aria("preferredStartDate", errors)} className={inputCls} />
            </Field>

            <Choice id="artworkInterest" legend="Artwork interest" required error={errors.artworkInterest}
              value={v.artworkInterest} onChange={set("artworkInterest")} options={ARTWORK_INTERESTS} />
            <Choice id="preferredTerm" legend="Preferred term" required error={errors.preferredTerm}
              value={v.preferredTerm} onChange={set("preferredTerm")} options={PREFERRED_TERMS} />

            <fieldset id="inquiry-artworkCount" className="min-w-0 sm:col-span-2" aria-describedby={errors.artworkCount ? "inquiry-artworkCount-err" : undefined}>
              <legend className="mb-2 text-sm font-semibold">Approximate artwork count <span className="font-normal text-ink-muted">(required)</span></legend>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  aria-label="Number of artworks"
                  inputMode="numeric"
                  value={v.countMode === "not-sure" ? "" : v.artworkCount}
                  disabled={v.countMode === "not-sure"}
                  onChange={(e) => set("artworkCount")(e.target.value)}
                  aria-invalid={!!errors.artworkCount}
                  className={cn(inputCls, "w-32")}
                />
                <label className="flex min-h-12 cursor-pointer items-center gap-3 bg-white/10 px-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink-foreground">
                  <input type="checkbox" checked={v.countMode === "not-sure"} onChange={(e) => {
                    started.current = true;
                    setV((cur) => ({ ...cur, countMode: e.target.checked ? "not-sure" : "number" }));
                    setErrors((er) => { const n = { ...er }; delete n.artworkCount; return n; });
                  }} className="h-5 w-5 accent-[hsl(40_23%_97%)]" />
                  Not sure
                </label>
              </div>
              {errors.artworkCount && <p id="inquiry-artworkCount-err" className={errCls}>{errors.artworkCount}</p>}
            </fieldset>

            {estimate && (
              <div className="bg-white/10 p-5 sm:col-span-2" data-testid="inquiry-estimate">
                <p className="font-semibold">Illustrative estimate</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-foreground/90">
                  {estimate.count} × {estimate.type === "original" ? "original" : "print"}
                  {estimate.artworkName ? ` (${estimate.artworkName})` : ""}, {estimate.term} months, reference value {formatCents(estimate.referenceValueCents)} each
                  {estimate.monthlyCents !== undefined
                    ? `: about ${formatCents(estimate.monthlyCents)} a month, ${formatCents(estimate.termCents!)} over the term.`
                    : ": custom quote."}
                  {" "}We’ll confirm real figures in your quote.
                </p>
                <button type="button" onClick={() => setEstimate(null)} className="mt-3 text-sm font-semibold underline underline-offset-4">
                  Remove this estimate
                </button>
              </div>
            )}

            <Field id="details" label="Tell us about your space, artwork interests, and timing" error={errors.details} wide>
              <textarea id="inquiry-details" rows={5} maxLength={3000} value={v.details} onChange={(e) => set("details")(e.target.value)} {...aria("details", errors)} className={cn(inputCls, "h-auto py-3")} />
            </Field>

            {/* Honeypot: hidden from people and screen readers; bots that fill every field give themselves away. */}
            <div aria-hidden /* taste-skill-ignore: off-screen honeypot */ className="absolute left-[-9999px] h-px w-px overflow-hidden">
              <label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set("website")(e.target.value)} /></label>
            </div>

            {state.kind === "failed" && (
              <p role="alert" className="bg-[hsl(336_74%_42%)] p-4 font-medium text-white sm:col-span-2" data-testid="inquiry-failed">{state.message}</p>
            )}

            <div className="sm:col-span-2">
              <ActionButton type="submit" variant="paper" className="w-full sm:w-auto" disabled={state.kind === "sending"} aria-disabled={state.kind === "sending"} data-testid="button-send-inquiry">
                {state.kind === "sending" ? "Sending…" : "Send rental inquiry"}
              </ActionButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls = "h-12 w-full bg-white px-4 text-base text-ink placeholder:text-neutral-500 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-foreground aria-[invalid=true]:outline aria-[invalid=true]:outline-[3px] aria-[invalid=true]:outline-[hsl(336_85%_72%)] disabled:opacity-50";
const errCls = "mt-2 text-sm font-medium text-[hsl(336_85%_80%)]";

function aria(field: string, errors: Record<string, string>, hint = false) {
  const ids = [hint ? `inquiry-${field}-hint` : "", errors[field] ? `inquiry-${field}-err` : ""].filter(Boolean).join(" ");
  return { "aria-invalid": !!errors[field], "aria-describedby": ids || undefined };
}

function Field({ id, label, hint, required, error, wide, children }: {
  id: string; label: string; hint?: string; required?: boolean; error?: string; wide?: boolean; children: ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={`inquiry-${id}`} className="mb-2 block text-sm font-semibold">
        {label} {required ? <span className="font-normal text-ink-muted">(required)</span> : <span className="font-normal text-ink-muted">(optional)</span>}
      </label>
      {hint && <p id={`inquiry-${id}-hint`} className="-mt-1 mb-2 text-[0.875rem] text-ink-muted">{hint}</p>}
      {children}
      {error && <p id={`inquiry-${id}-err`} className={errCls}>{error}</p>}
    </div>
  );
}

function Choice({ id, legend, required, error, value, onChange, options }: {
  id: string; legend: string; required?: boolean; error?: string; value: string; onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <fieldset id={`inquiry-${id}`} className="min-w-0 sm:col-span-2" aria-describedby={error ? `inquiry-${id}-err` : undefined}>
      <legend className="mb-2 text-sm font-semibold">
        {legend} {required && <span className="font-normal text-ink-muted">(required)</span>}
      </legend>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <label key={o.value} className={cn(
            "min-h-12 cursor-pointer px-4 py-3 text-base font-medium transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink-foreground",
            value === o.value ? "bg-ink-foreground text-ink" : "bg-white/10 hover:bg-white/20",
          )}>
            <input type="radio" name={id} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
      {error && <p id={`inquiry-${id}-err`} className={errCls}>{error}</p>}
    </fieldset>
  );
}
