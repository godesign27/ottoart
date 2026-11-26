import type { ReactNode } from "react";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { PRIVACY_CONTACT_EMAIL, PRIVACY_POLICY } from "@shared/privacyPolicy";

// /privacy — public, no sign-in. The text lives in shared/privacyPolicy.ts.

const URL_OR_EMAIL = /(https:\/\/\S+[^\s.,]|[\w.+-]+@[\w-]+\.[\w.]+[^\s.,])/g;

// Make the Google permissions link and the contact email clickable; everything else is plain text.
function linkify(text: string): ReactNode[] {
  return text.split(URL_OR_EMAIL).map((part, i) => {
    if (i % 2 === 0) return part;
    const href = part.startsWith("http") ? part : `mailto:${part}`;
    return (
      <a key={i} href={href} className="break-words font-medium underline underline-offset-4 hover:text-primary"
        {...(part.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {part}
      </a>
    );
  });
}

export default function PrivacyPage() {
  useDocumentMeta({
    title: "Privacy Policy | Otto Art",
    description: `How Otto Art collects, uses and protects information on ottoart.app and in Email Processor. Questions: ${PRIVACY_CONTACT_EMAIL}.`,
  });
  const policy = PRIVACY_POLICY;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LiveSiteNavigation />
      <main id="main" className="flex-1">
        <article className="mx-auto w-full max-w-[90rem] px-4 py-12 sm:px-6 md:py-20 lg:px-10">
          <div className="max-w-[68ch]">
            <h1 className="font-display text-[2.5rem] leading-[1.05] tracking-[-0.02em] md:text-[3.5rem]">{policy.title}</h1>
            <p className="mt-4 text-sm text-muted-foreground">Last updated: {policy.lastUpdated}</p>
            <p className="mt-8 text-lg leading-relaxed">{policy.intro}</p>

            {policy.sections.map((s) => (
              <section key={s.heading} className="mt-12">
                <h2 className="text-2xl font-semibold tracking-[-0.01em]">{s.heading}</h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed">
                  {s.blocks.map((b, i) =>
                    "p" in b ? (
                      <p key={i}>{linkify(b.p)}</p>
                    ) : (
                      <ul key={i} className="list-disc space-y-2 pl-6 marker:text-muted-foreground">
                        {b.ul.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
