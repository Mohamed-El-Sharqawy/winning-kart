import type { CreateUserDto } from "../dto/team.dto";
import type { Member, MemberRoleSelection } from "../types/team.types";

export const ROLE_OPTIONS = [
  { value: "owner", label: "Agency — Owner" },
  { value: "admin", label: "Agency — Admin" },
  { value: "account_manager", label: "Agency — Account manager" },
  { value: "marketer", label: "Agency — Marketer" },
  { value: "analyst", label: "Agency — Analyst" },
  { value: "client_admin", label: "Client — Admin" },
  { value: "client_viewer", label: "Client — Viewer" },
];

type RoleBody = Omit<CreateUserDto, "email" | "password" | "displayName">;

export const SELECTION_BODY: Record<MemberRoleSelection, RoleBody> = {
  owner: { role: "admin", agencyRole: "owner" },
  admin: { role: "admin", agencyRole: "admin" },
  account_manager: { role: "admin", agencyRole: "account_manager" },
  marketer: { role: "admin", agencyRole: "marketer" },
  analyst: { role: "admin", agencyRole: "analyst" },
  client_admin: { role: "client", clientRoleTier: "admin" },
  client_viewer: { role: "client", clientRoleTier: "viewer" },
};

export function selectionFromMember(member: Member): MemberRoleSelection {
  if (member.role === "client") {
    return member.clientRoleTier === "viewer" ? "client_viewer" : "client_admin";
  }
  const agencyRole = member.agencyRole ?? "admin";
  return agencyRole as MemberRoleSelection;
}

export function isClientSelection(selection: MemberRoleSelection): boolean {
  return selection === "client_admin" || selection === "client_viewer";
}

export const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "suspended", label: "Suspended" },
];
