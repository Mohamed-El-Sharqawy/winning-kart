export interface PatDto {
  id: string;
  name: string;
  scopes: string[] | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface CreatePatResponseDto {
  id: string;
  name: string;
  token: string;
}

export interface RevokePatResponseDto {
  ok: boolean;
}
