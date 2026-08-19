import type { AgencyRole, ClientTier } from "@/shared/data/roles.data";

export type MemberRole = "admin" | "client";

export type MemberStatus = "active" | "invited" | "suspended";

export type MemberRoleSelection =
  | "owner"
  | "admin"
  | "account_manager"
  | "marketer"
  | "analyst"
  | "client_admin"
  | "client_viewer";

export interface Member {
  id: string;
  email: string;
  displayName: string;
  role: MemberRole;
  agencyRole: AgencyRole | null;
  clientRoleTier: ClientTier | null;
  status: MemberStatus;
  lastActiveAt: Date | null;
  createdAt: Date;
}
