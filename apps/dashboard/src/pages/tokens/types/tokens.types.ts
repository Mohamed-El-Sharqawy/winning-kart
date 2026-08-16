export type PatStatus = "active" | "revoked";

export type PatScope = "read" | "sync" | "tasks";

export interface Pat {
  id: string;
  name: string;
  scopes: string[] | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  status: PatStatus;
}

export interface CreatedPat {
  id: string;
  name: string;
  token: string;
}
