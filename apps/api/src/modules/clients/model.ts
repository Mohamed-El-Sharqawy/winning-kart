import { and, asc, eq } from "drizzle-orm";
import { clients, db, users } from "@wk/db";
import type { Client } from "@wk/db";

export class ClientsModel {
  listClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(asc(clients.createdAt));
  }

  async findById(id: string): Promise<Client | undefined> {
    const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return rows[0];
  }

  async slugTaken(slug: string): Promise<boolean> {
    const rows = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.slug, slug))
      .limit(1);
    return rows.length > 0;
  }

  async insertClient(input: {
    id: string;
    name: string;
    slug: string;
    industry?: string | null;
    displayCurrency?: string;
  }): Promise<Client> {
    const rows = await db.insert(clients).values(input).returning();
    return rows[0];
  }

  async updateClient(
    id: string,
    patch: Partial<typeof clients.$inferInsert>
  ): Promise<Client | undefined> {
    const rows = await db
      .update(clients)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return rows[0];
  }

  async deleteClient(id: string): Promise<boolean> {
    const rows = await db.delete(clients).where(eq(clients.id, id)).returning({
      id: clients.id,
    });
    return rows.length > 0;
  }

  async adminUserExists(id: string): Promise<boolean> {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "admin")))
      .limit(1);
    return rows.length > 0;
  }
}
