export interface PatDto {
  id: string;
  name: string;
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
