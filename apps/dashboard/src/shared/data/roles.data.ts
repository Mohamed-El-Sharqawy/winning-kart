import type { WorkspaceTab } from "@/routes/search";

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

export const CLIENT_NAV_GROUPS = [
  { label: "Your Business", items: ["Overview", "Campaigns", "Ad Sets", "Creatives"] },
] as const;

export const CLIENT_TABS = {
  Campaigns: "campaigns",
  "Ad Sets": "ad-sets",
  Creatives: "creatives",
} as const satisfies Record<string, WorkspaceTab>;

export const CLIENT_WORKSPACE_TABS: readonly WorkspaceTab[] = Object.values(CLIENT_TABS);
