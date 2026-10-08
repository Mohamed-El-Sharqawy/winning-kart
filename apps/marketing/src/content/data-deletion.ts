import type { LegalDoc } from "./types";

export const dataDeletionDoc: LegalDoc = {
  title: "Data Deletion Instructions",
  description:
    "How to delete your Winning Kart account data, including data received from Facebook through Facebook Login for Business.",
  path: "/data-deletion/",
  updated: "October 8, 2026",
  sections: [
    {
      heading: "Delete your data through the service",
      paragraphs: [
        "You can delete your Winning Kart account and its data at any time. Sign in to the service, open Settings, and choose Delete account. This removes your account, workspaces, connected platform integrations, and all synced reporting data.",
        "If you cannot sign in, email legal@winningkart.tech from the address on your account and request deletion. We process deletion requests within 30 days and confirm by email when complete.",
      ],
    },
    {
      heading: "Delete your data through Facebook",
      paragraphs: [
        "If you signed in to Winning Kart using Facebook, you can also remove the app from your Facebook account. Go to Facebook Settings, open Apps and Websites, select Winning Kart, and choose Remove. This revokes our access to your Facebook data and deletes the Facebook-related data linked to your sign-in.",
        "Removing the app on Facebook does not delete your Winning Kart account history. To delete everything, follow the steps above as well.",
      ],
    },
    {
      heading: "What we delete",
      paragraphs: [
        "Deletion removes your profile data, authentication records, workspace and client data, connected platform integrations, and synced advertising and revenue reporting data. Data is removed from live systems and purged from backups within 90 days, except where we must retain records for legal, tax, or audit obligations.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        "Questions about data deletion can be sent to legal@winningkart.tech. See our Privacy Policy for how we handle data in general.",
      ],
    },
  ],
};
