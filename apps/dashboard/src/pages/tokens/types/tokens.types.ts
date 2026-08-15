export type PatStatus = "active" | "revoked";

export interface Pat {
  id: string;
  name: string;
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
