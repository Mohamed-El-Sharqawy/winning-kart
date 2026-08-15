import type { AgencyRole, ClientTier } from "@/shared/data/roles.data";

export type SessionRole = "admin" | "client";

export interface Session {
  id: string;
  email: string;
  displayName: string;
  role: SessionRole;
  agencyRole?: AgencyRole;
  clientRoleTier?: ClientTier;
}
