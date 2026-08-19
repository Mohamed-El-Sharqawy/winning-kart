import type { UserDto } from "../dto/team.dto";
import type { Member } from "../types/team.types";

function toDate(value: string | null): Date | null {
  return value ? new Date(value) : null;
}

export function toMember(dto: UserDto): Member {
  return {
    id: dto.id,
    email: dto.email,
    displayName: dto.displayName,
    role: dto.role,
    agencyRole: dto.agencyRole,
    clientRoleTier: dto.clientRoleTier,
    status: dto.status,
    lastActiveAt: toDate(dto.lastActiveAt),
    createdAt: toDate(dto.createdAt ?? null),
  };
}

export function toMembers(dtos: UserDto[]): Member[] {
  return dtos.map(toMember);
}
