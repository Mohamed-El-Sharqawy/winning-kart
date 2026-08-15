export type SessionRole = "admin" | "client";

export interface SessionDto {
  sub: string;
  role: SessionRole;
}
