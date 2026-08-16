import type { CreatePatResponseDto, PatDto } from "../dto/tokens.dto";
import type { CreatedPat, Pat } from "../types/tokens.types";

export function toPat(dto: PatDto): Pat {
  return {
    id: dto.id,
    name: dto.name,
    scopes: Array.isArray(dto.scopes) ? dto.scopes : null,
    createdAt: new Date(dto.createdAt),
    lastUsedAt: dto.lastUsedAt ? new Date(dto.lastUsedAt) : null,
    revokedAt: dto.revokedAt ? new Date(dto.revokedAt) : null,
    status: dto.revokedAt ? "revoked" : "active",
  };
}

export function toPats(dtos: PatDto[]): Pat[] {
  return dtos.map(toPat);
}

export function toCreatedPat(dto: CreatePatResponseDto): CreatedPat {
  return { id: dto.id, name: dto.name, token: dto.token };
}
