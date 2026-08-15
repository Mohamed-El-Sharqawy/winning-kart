import { asc, eq } from "drizzle-orm";
import { clients, db } from "@wk/db";
import type { Client } from "@wk/db";

export class ClientsModel {
  listClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(asc(clients.createdAt));
  }

  async slugTaken(slug: string): Promise<boolean> {
    const rows = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.slug, slug))
      .limit(1);
    return rows.length > 0;
  }

  async insertClient(input: { id: string; name: string; slug: string }): Promise<Client> {
    const rows = await db.insert(clients).values(input).returning();
    return rows[0];
  }
}
