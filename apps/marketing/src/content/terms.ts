import type { LegalDoc } from "./types";

export const termsDoc: LegalDoc = {
  title: "Terms of Service",
  description:
    "The terms governing use of the Winning Kart advertising and revenue reporting platform, including connected-platform access and acceptable use.",
  path: "/terms/",
  updated: "October 8, 2026",
  sections: [
    {
      heading: "Agreement to these terms",
      paragraphs: [
        "These Terms of Service (\u201cterms\u201d) govern your use of Winning Kart (the \u201cservice\u201d) provided by Winning Kart (\u201cwe\u201d, \u201cus\u201d). By creating an account or using the service, you agree to these terms on behalf of yourself and the organization you represent.",
      ],
    },
    {
      heading: "The service",
      paragraphs: [
        "Winning Kart is a reporting platform for marketing agencies. It connects to advertising and commerce platforms you authorize, retrieves performance and revenue data, and presents unified reporting and alerts.",
        "We may add, change, or remove features as the service evolves. Where a change materially reduces existing functionality, we will give reasonable notice.",
      ],
    },
    {
      heading: "Accounts and access",
      paragraphs: [
        "You are responsible for the accuracy of your account details, for keeping credentials secure, and for the actions of anyone you invite to your workspaces.",
        "Access is tied to your subscription or plan. We may suspend access for nonpayment or material breach of these terms, with notice where practicable.",
      ],
    },
    {
      heading: "Connected platforms",
      paragraphs: [
        "When you connect a third-party platform, you authorize us to access it under the credentials and scopes you approve. Access for advertising and commerce integrations is read-only; we do not modify your campaigns, ads, or store data.",
        "Our retrieval and use of platform data follows the platform's own terms and your permissions there. We are not affiliated with, endorsed by, or sponsored by any connected platform. Platforms may change their APIs, limits, or access tiers, which can affect the service; where that happens we will work to keep your reporting working but cannot guarantee uninterrupted access to any platform.",
      ],
    },
    {
      heading: "Acceptable use",
      paragraphs: [
        "You may not use the service to violate law or third-party rights, to attempt unauthorized access to any system, to exceed or circumvent platform rate limits, or to reverse engineer the service except as permitted by law.",
        "You may not resell, sublicense, or provide service access to third parties without our written agreement.",
      ],
    },
    {
      heading: "Customer data and confidentiality",
      paragraphs: [
        "You retain all rights to the data you and your connected platforms provide. We process it only to provide the service, as described in our Privacy Policy, and keep it confidential.",
      ],
    },
    {
      heading: "Availability",
      paragraphs: [
        "We aim for high availability but do not guarantee uninterrupted service. The service depends on third-party platforms and infrastructure; downtime, API changes, or data delays on their side can affect reporting.",
      ],
    },
    {
      heading: "Disclaimers",
      paragraphs: [
        "The service is provided \u201cas is\u201d without warranties of any kind, except those that cannot be excluded by law. We do not warrant that reports are complete, error-free, or fit for a particular purpose, and metrics may differ from those shown in the source platforms due to attribution models, windows, and sync timing.",
      ],
    },
    {
      heading: "Limitation of liability",
      paragraphs: [
        "To the maximum extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages, or for lost profits or revenue, arising from use of the service. Our aggregate liability for claims relating to the service is limited to the fees you paid us in the twelve months before the claim.",
      ],
    },
    {
      heading: "Changes to these terms",
      paragraphs: [
        "We may update these terms. Material changes will be announced in the service or by email. Continuing to use the service after changes take effect means you accept the updated terms. The \u201cLast updated\u201d date above always reflects the current version.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        "Questions about these terms can be sent to legal@winningkart.tech.",
      ],
    },
  ],
};
