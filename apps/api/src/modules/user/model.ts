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

export class UserModel {
  listUsers() {
    return db.select(listUserColumns).from(users).orderBy(asc(users.createdAt));
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
    const rows = await db
      .insert(users)
      .values(input)
      .returning({
        ...listUserColumns,
        lastActiveAt: users.lastActiveAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return rows[0];
  }
}
