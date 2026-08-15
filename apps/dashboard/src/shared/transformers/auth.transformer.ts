import type { LoginResponseDto, MeDto } from "../dto/auth.dto";
import type { Session, SessionRole } from "../types/auth.types";

export function toSession(dto: MeDto): Session {
  return {
    id: dto.id,
    email: dto.email,
    displayName: dto.displayName,
    role: dto.role,
    agencyRole: dto.agencyRole as Session["agencyRole"],
    clientRoleTier: dto.clientRoleTier as Session["clientRoleTier"],
  };
}

export function toRole(dto: LoginResponseDto): SessionRole {
  return dto.role;
}
