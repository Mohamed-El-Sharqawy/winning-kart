export type SessionRoleDto = "admin" | "client";

export interface MeDto {
  id: string;
  email: string;
  displayName: string;
  role: SessionRoleDto;
  agencyRole?: string;
  clientRoleTier?: string;
}

export interface LoginResponseDto {
  role: SessionRoleDto;
}

export interface LogoutResponseDto {
  ok: boolean;
}
