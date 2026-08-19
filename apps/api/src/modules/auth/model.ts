import { and, desc, eq, isNull } from "drizzle-orm";
import { apiTokens, db, users } from "@wk/db";
import type { Pat, User } from "@wk/db";
import { sha256Hex } from "../../lib/crypto";

export const PAT_SCOPES = ["read", "sync", "tasks"] as const;
export type PatScope = (typeof PAT_SCOPES)[number];

export interface ScopedPat {
  userId: string;
  role: "admin" | "client";
  scopes: string[] | null;
}

export type SafeUser = Omit<User, "passwordHash">;

const safeUserColumns = {
  id: users.id,
  email: users.email,
  displayName: users.displayName,
  role: users.role,
  agencyRole: users.agencyRole,
  clientRoleTier: users.clientRoleTier,
  status: users.status,
  lastActiveAt: users.lastActiveAt,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export class AuthModel {
  async findUserByEmail(email: string): Promise<User | null> {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] ?? null;
  }

  async touchLastActive(id: string): Promise<void> {
    await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, id));
  }

  async findUserById(id: string): Promise<SafeUser | null> {
    const rows = await db.select(safeUserColumns).from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  }

  listPats(userId: string) {
    return db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        scopes: apiTokens.scopes,
        createdAt: apiTokens.createdAt,
        lastUsedAt: apiTokens.lastUsedAt,
        revokedAt: apiTokens.revokedAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.userId, userId))
      .orderBy(desc(apiTokens.createdAt));
  }

  async insertPat(input: {
    id: string;
    name: string;
    userId: string;
    tokenHash: string;
    scopes: string[] | null;
  }): Promise<Pick<Pat, "id" | "name">> {
    const rows = await db
      .insert(apiTokens)
      .values(input)
      .returning({ id: apiTokens.id, name: apiTokens.name });
    return rows[0];
  }

  async findActivePatByHash(tokenHash: string): Promise<{ id: string; userId: string } | null> {
    const rows = await db
      .select({ id: apiTokens.id, userId: apiTokens.userId })
      .from(apiTokens)
      .where(and(eq(apiTokens.tokenHash, tokenHash), isNull(apiTokens.revokedAt)))
      .limit(1);
    const row = rows[0];
    if (!row || row.userId === null) {
      return null;
    }
    return { id: row.id, userId: row.userId };
  }

  async findPatByTokenScoped(token: string): Promise<ScopedPat | null> {
    const rows = await db
      .select({ userId: users.id, role: users.role, scopes: apiTokens.scopes })
      .from(apiTokens)
      .innerJoin(users, eq(apiTokens.userId, users.id))
      .where(and(eq(apiTokens.tokenHash, sha256Hex(token)), isNull(apiTokens.revokedAt)))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return null;
    }
    return { userId: row.userId, role: row.role, scopes: row.scopes };
  }

  async touchPatLastUsed(id: string): Promise<void> {
    await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, id));
  }

  async revokePatForUser(id: string, userId: string): Promise<boolean> {
    const revoked = await db
      .update(apiTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(apiTokens.id, id), eq(apiTokens.userId, userId), isNull(apiTokens.revokedAt))
      )
      .returning({ id: apiTokens.id });
    if (revoked.length > 0) {
      return true;
    }
    const existing = await db
      .select({ id: apiTokens.id })
      .from(apiTokens)
      .where(and(eq(apiTokens.id, id), eq(apiTokens.userId, userId)))
      .limit(1);
    return existing.length > 0;
  }
}
