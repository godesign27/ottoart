import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

// Shared pieces for the marketing pages. Rules: docs/design.md.

const actionBase =
  "inline-flex min-h-12 items-center justify-center gap-2 px-6 text-base font-semibold transition-[background-color,color,transform] duration-200 [transition-timing-function:var(--ease-out)] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60";

export const actionStyles = {
  /** Near-black on light ground. The one primary action of a section. */
  solid: "bg-primary text-primary-foreground hover:bg-primary/85 focus-visible:outline-ring",
  /** Paper on the ink or accent surface. */
  paper: "bg-ink-foreground text-ink hover:bg-ink-foreground/85 focus-visible:outline-ink-foreground",
  /** Secondary: a tone step, not an outline. */
  quiet: "bg-secondary text-secondary-foreground hover:bg-accent focus-visible:outline-ring",
  /** Secondary on the ink surface. */
  quietInk: "bg-white/10 text-ink-foreground hover:bg-white/20 focus-visible:outline-ink-foreground",
} as const;

type Variant = keyof typeof actionStyles;

/** A link styled as an action. Hash links (#section) and external URLs are plain anchors; site routes use the router. */
export function ActionLink({ href, variant = "solid", className, children, ...rest }:
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; children: ReactNode }) {
  const cls = cn(actionBase, actionStyles[variant], className);
  if (href.startsWith("#") || /^https?:/.test(href)) {
    return <a href={href} className={cls} {...rest}>{children}</a>;
  }
  return <Link href={href} className={cls} {...rest}>{children}</Link>;
}

export const ActionButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  ({ variant = "solid", className, ...rest }, ref) => (
    <button ref={ref} className={cn(actionBase, actionStyles[variant], className)} {...rest} />
  ),
);
ActionButton.displayName = "ActionButton";

/** Page frame: one pair of outer margins for every section. */
export function Frame({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10", className)}>{children}</div>;
}

/** Section heading in the display face. Two lines or fewer at every width: keep it short. */
export function SectionTitle({ as: Tag = "h2", className, children, id }:
  { as?: "h2" | "h3"; className?: string; children: ReactNode; id?: string }) {
  return (
    <Tag id={id} data-reveal className={cn("font-display text-[2.25rem] leading-[1.05] tracking-[-0.02em] text-balance md:text-[3.25rem]", className)}>
      {children}
    </Tag>
  );
}
