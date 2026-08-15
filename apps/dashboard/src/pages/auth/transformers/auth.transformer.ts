import type { SessionDto } from "../types/auth.types";
import type { LoginResponse } from "../dto/auth.dto";

export function toSession(dto: LoginResponse): SessionDto & { token: string } {
  return { sub: dto.token, role: dto.role, token: dto.token };
}
