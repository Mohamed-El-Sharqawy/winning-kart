import { asc, eq } from "drizzle-orm";
import { clientUserAssignments, clients, db, users } from "@wk/db";
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
  clientId: clientUserAssignments.clientId,
  clientName: clients.name,
};

function userViewQuery() {
  return db
    .select(userReturning)
    .from(users)
    .leftJoin(clientUserAssignments, eq(clientUserAssignments.userId, users.id))
    .leftJoin(clients, eq(clients.id, clientUserAssignments.clientId));
}

export type UserView = SafeUser & {
  clientId: string | null;
  clientName: string | null;
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

export interface UserModel {
  listUsers(): Promise<UserView[]>;
  findById(id: string): Promise<UserView | null>;
  emailTaken(email: string): Promise<boolean>;
  insertUser(input: NewUser): Promise<UserView>;
  update(id: string, patch: UserUpdatePatch): Promise<UserView | null>;
  remove(id: string): Promise<void>;
  clientExists(id: string): Promise<boolean>;
  assignedClientId(userId: string): Promise<string | null>;
  upsertClientAssignment(userId: string, clientId: string): Promise<void>;
  deleteClientAssignment(userId: string): Promise<void>;
}

export class DrizzleUserModel implements UserModel {
  listUsers() {
    return userViewQuery().orderBy(asc(users.createdAt));
  }

  async findById(id: string): Promise<UserView | null> {
    const rows = await userViewQuery().where(eq(users.id, id)).limit(1);
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

  async insertUser(input: NewUser): Promise<UserView> {
    const rows = await db
      .insert(users)
      .values(input)
      .returning({ ...listUserColumns, updatedAt: users.updatedAt });
    return { ...rows[0], clientId: null, clientName: null };
  }

  async update(id: string, patch: UserUpdatePatch): Promise<UserView | null> {
    const rows = await db
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id });
    if (rows.length === 0) {
      return null;
    }
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async clientExists(id: string): Promise<boolean> {
    const rows = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1);
    return rows.length > 0;
  }

  async assignedClientId(userId: string): Promise<string | null> {
    const rows = await db
      .select({ clientId: clientUserAssignments.clientId })
      .from(clientUserAssignments)
      .where(eq(clientUserAssignments.userId, userId))
      .limit(1);
    return rows[0]?.clientId ?? null;
  }

  async upsertClientAssignment(userId: string, clientId: string): Promise<void> {
    await db
      .insert(clientUserAssignments)
      .values({ id: crypto.randomUUID(), userId, clientId })
      .onConflictDoUpdate({
        target: clientUserAssignments.userId,
        set: { clientId },
      });
  }

  async deleteClientAssignment(userId: string): Promise<void> {
    await db.delete(clientUserAssignments).where(eq(clientUserAssignments.userId, userId));
  }
}
