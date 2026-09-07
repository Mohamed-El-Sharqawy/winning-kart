import { asc, eq } from "drizzle-orm";
import { db, users } from "@wk/db";
import type { User } from "@wk/db";
import type { SafeUser } from "../auth/model";

const listUserColumns = {
  id: users.id,
  email: users.email,
  displayName: users.displayName,
  role: users.role,
  agencyRole: users.agencyRole,
  clientRoleTier: users.clientRoleTier,
  status: users.status,
  lastActiveAt: users.lastActiveAt,
  createdAt: users.createdAt,
};

const userReturning = {
  ...listUserColumns,
  updatedAt: users.updatedAt,
};

export interface NewUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: "admin" | "client";
  agencyRole: "owner" | "admin" | "account_manager" | "marketer" | "analyst" | null;
  clientRoleTier: "admin" | "viewer" | null;
}

export interface UserUpdatePatch {
  displayName?: string;
  role?: "admin" | "client";
  agencyRole?: "owner" | "admin" | "account_manager" | "marketer" | "analyst" | null;
  clientRoleTier?: "admin" | "viewer" | null;
  status?: "active" | "invited" | "suspended";
}

export class UserModel {
  listUsers() {
    return db.select(listUserColumns).from(users).orderBy(asc(users.createdAt));
  }

  async findById(id: string): Promise<SafeUser | null> {
    const rows = await db.select(userReturning).from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async emailTaken(email: string): Promise<boolean> {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return rows.length > 0;
  }

  async insertUser(input: NewUser): Promise<SafeUser> {
    const rows = await db.insert(users).values(input).returning(userReturning);
    return rows[0];
  }

  async update(id: string, patch: UserUpdatePatch): Promise<SafeUser | null> {
    const rows = await db
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning(userReturning);
    return rows[0] ?? null;
  }

  async remove(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}
