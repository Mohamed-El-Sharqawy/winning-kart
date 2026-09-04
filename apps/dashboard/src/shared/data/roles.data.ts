export const ROLES = ["owner", "admin", "account_manager", "marketer", "analyst"] as const;
export type AgencyRole = (typeof ROLES)[number];

export const CLIENT_TIERS = ["admin", "viewer"] as const;
export type ClientTier = (typeof CLIENT_TIERS)[number];

export const NAV_GROUPS = [
  { label: "Portfolio", items: ["Overview", "Alerts & Tasks", "Clients", "Reports"] },
  {
    label: "Client Workspace",
    items: [
      "Ad Accounts",
      "Campaigns",
      "Ad Sets",
      "Ads & Creatives",
      "Analytics",
      "Audiences",
      "Budget & Pacing",
      "Attribution & Revenue",
      "Marketing Plans",
    ],
  },
  { label: "Administration", items: ["Integrations", "Integration Guide", "Team & Permissions", "Settings"] },
] as const;
