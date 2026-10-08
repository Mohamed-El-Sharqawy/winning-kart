import type { LegalDoc } from "./types";

export const privacyDoc: LegalDoc = {
  title: "Privacy Policy",
  description:
    "How Winning Kart collects, uses, shares, and protects data when you use the service, including data retrieved through advertising and commerce platform connectors.",
  path: "/privacy/",
  updated: "October 8, 2026",
  sections: [
    {
      heading: "Overview",
      paragraphs: [
        "This Privacy Policy explains how Winning Kart (\u201cwe\u201d, \u201cus\u201d) handles data when agencies and their staff use our advertising and revenue reporting platform (the \u201cservice\u201d). It covers data you give us directly and data we retrieve on your behalf from connected advertising and commerce platforms.",
        "By creating an account or using the service, you agree to this policy. If you connect a platform on behalf of an organization, you confirm you are authorized to grant us access to that organization's data.",
      ],
    },
    {
      heading: "Data we collect",
      paragraphs: [
        "Account data: your name, email address, role, and workspace membership, plus authentication events such as sign-ins.",
        "Advertising data: when you connect an advertising platform such as Meta, Google Ads, TikTok, Snapchat, Pinterest, or LinkedIn, we retrieve campaign, ad set, ad, and performance metrics data through that platform's APIs using read-only access.",
        "Commerce data: when you connect a store such as Shopify or WooCommerce, we retrieve order and revenue data needed to calculate revenue attribution and reporting.",
        "Technical data: server logs, request metadata, and error diagnostics used to operate and secure the service.",
      ],
    },
    {
      heading: "How we use data",
      paragraphs: [
        "We use collected data to provide the service: syncing connected platforms, computing metrics and attribution, displaying reports, and alerting you to anomalies or sync failures.",
        "We also use data to secure the service, provide support, comply with law, and make improvements. We do not sell personal data and we do not use your connected platform data for advertising.",
      ],
    },
    {
      heading: "Legal bases",
      paragraphs: [
        "Where required, we process data on the following bases: performance of our contract with you (operating the service), your consent (platform connections you authorize), legitimate interests (security and fraud prevention), and legal obligations.",
      ],
    },
    {
      heading: "Sharing",
      paragraphs: [
        "We share data only with service providers that help us run the service, such as hosting and infrastructure providers, bound by confidentiality and security obligations.",
        "We may disclose data if required by law or to protect our rights. Connected platform data is retrieved from and remains subject to those platforms' own terms and policies.",
      ],
    },
    {
      heading: "Retention",
      paragraphs: [
        "We retain account data while your workspace is active and for a limited period after closure for backup, legal, and audit purposes. Synced reporting data is retained while the related client workspace exists, and is deleted when you disconnect a platform or delete the workspace, except where retention is legally required.",
      ],
    },
    {
      heading: "Security",
      paragraphs: [
        "We protect data in transit with TLS and at rest with encryption, restrict access using least-privilege principles, and log administrative actions. No method of transmission or storage is perfectly secure, and we encourage strong credentials and timely revocation of access for departing staff.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "Depending on your jurisdiction, you may have rights to access, correct, export, or delete personal data, and to object to or restrict processing. To exercise these rights, contact us using the details below. Agency administrators may also manage or delete client workspaces and connected platforms directly in the service.",
      ],
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "We may update this policy as the service evolves. Material changes will be announced in the service or by email where we have your address. The \u201cLast updated\u201d date above always reflects the current version.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        "Questions about this policy or your data can be sent to legal@winningkart.tech.",
      ],
    },
  ],
};
