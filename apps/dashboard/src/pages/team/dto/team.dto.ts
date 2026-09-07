import type { AgencyRole, ClientTier } from "@/shared/data/roles.data";

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "client";
  agencyRole: AgencyRole | null;
  clientRoleTier: ClientTier | null;
  clientId?: string | null;
  clientName?: string | null;
  status: "active" | "invited" | "suspended";
  lastActiveAt: string | null;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  displayName: string;
  role: "admin" | "client";
  agencyRole?: AgencyRole;
  clientRoleTier?: ClientTier;
  clientId?: string;
}

export interface UpdateUserDto {
  displayName?: string;
  role?: "admin" | "client";
  agencyRole?: AgencyRole | null;
  clientRoleTier?: ClientTier | null;
  clientId?: string | null;
  status?: "active" | "invited" | "suspended";
}
