// The privacy policy at /privacy. One copy of the text, used by the page (client/src/pages/live-site/privacy.tsx)
// and by the server-rendered fallback (server/seo.ts), so crawlers that don't run JavaScript, such as
// Google's OAuth review, read the same words as visitors.

export type PolicyBlock = { p: string } | { ul: string[] };

export interface PolicySection {
  heading: string;
  blocks: PolicyBlock[];
}

export const PRIVACY_CONTACT_EMAIL = "godesigngo@gmail.com";

export const PRIVACY_POLICY = {
  title: "Privacy Policy",
  lastUpdated: "November 25, 2026",
  intro:
    'This Privacy Policy explains how Otto Art ("we," "us") collects, uses, and protects information when you use ottoart.app and the Email Processor application that connects to Google accounts.',
  sections: [
    {
      heading: "Information we access",
      blocks: [
        { p: "When you connect a Google account to Email Processor, you grant access through Google's OAuth consent screen. Depending on the permissions you approve, we may access:" },
        { ul: [
          "Your basic Google profile information (name and email address)",
          "Gmail messages, labels, and metadata needed to process, organize, or respond to email on your behalf",
        ] },
        { p: "We access only the data needed to provide the features you have enabled." },
      ],
    },
    {
      heading: "How we use information",
      blocks: [
        { p: "We use Google user data only to provide and improve the user-facing features of Email Processor, such as reading, sorting, labeling, summarizing, or drafting email at your direction. We do not use Google user data for advertising, and we do not sell it." },
      ],
    },
    {
      heading: "Google API Services — Limited Use",
      blocks: [
        { p: "Email Processor's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. Specifically:" },
        { ul: [
          "We use Google user data only to provide or improve user-facing features.",
          "We do not transfer Google user data to third parties except as necessary to provide those features, to comply with law, or as part of a merger or acquisition with notice to users.",
          "We do not use Google user data for serving advertisements.",
          "Humans do not read Google user data unless you give explicit consent, it is necessary for security purposes, it is required by law, or the data is aggregated and anonymized for internal operations.",
          "We do not use Google user data to develop, improve, or train generalized AI or machine learning models.",
        ] },
      ],
    },
    {
      heading: "Storage and security",
      blocks: [
        { p: "Access tokens and any processed data are stored securely and kept only as long as needed to provide the service. We use industry-standard safeguards to protect data in transit and at rest." },
      ],
    },
    {
      heading: "Sharing",
      blocks: [
        { p: "We do not sell, rent, or share your personal information, except with service providers that help us operate the service under confidentiality obligations, or where required by law." },
      ],
    },
    {
      heading: "Your choices",
      blocks: [
        { p: "You can disconnect Email Processor at any time by removing its access at https://myaccount.google.com/permissions. To request deletion of any data we hold, contact us at the email below, and we will delete it within 30 days." },
      ],
    },
    {
      heading: "Children",
      blocks: [
        { p: "Our services are not directed to children under 13, and we do not knowingly collect their information." },
      ],
    },
    {
      heading: "Changes",
      blocks: [
        { p: 'We may update this policy from time to time. Changes will be posted on this page with a new "Last updated" date.' },
      ],
    },
    {
      heading: "Contact",
      blocks: [
        { p: `Questions about this policy: ${PRIVACY_CONTACT_EMAIL}` },
      ],
    },
  ] as PolicySection[],
};
