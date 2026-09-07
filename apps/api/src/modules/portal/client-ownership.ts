import { eq } from "drizzle-orm";
import { adAccounts, clientUserAssignments, clients, db } from "@wk/db";

export interface PortalClientRow {
  id: string;
  name: string;
  slug: string;
  status: "active" | "paused" | "archived";
  industry: string | null;
  displayCurrency: string;
  createdAt: Date;
}

export interface PortalAccessModel {
  findAssignedClient(userId: string): Promise<PortalClientRow | null>;
  findClientIdForAdAccount(adAccountId: string): Promise<string | null>;
}

const clientColumns = {
  id: clients.id,
  name: clients.name,
  slug: clients.slug,
  status: clients.status,
  industry: clients.industry,
  displayCurrency: clients.displayCurrency,
  createdAt: clients.createdAt,
};

export class ClientOwnershipModel implements PortalAccessModel {
  async findAssignedClient(userId: string): Promise<PortalClientRow | null> {
    const assigned = await db
      .select({ clientId: clientUserAssignments.clientId })
      .from(clientUserAssignments)
      .where(eq(clientUserAssignments.userId, userId))
      .limit(1);
    if (assigned.length > 0) {
      const byId = await this.findClientById(assigned[0].clientId);
      if (byId !== null) {
        return byId;
      }
    }
    return this.findClientByPrimaryContact(userId);
  }

  async findClientById(id: string): Promise<PortalClientRow | null> {
    const rows = await db.select(clientColumns).from(clients).where(eq(clients.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findClientByPrimaryContact(userId: string): Promise<PortalClientRow | null> {
    const rows = await db
      .select(clientColumns)
      .from(clients)
      .where(eq(clients.primaryContactUserId, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findClientIdForAdAccount(adAccountId: string): Promise<string | null> {
    const rows = await db
      .select({ clientId: adAccounts.clientId })
      .from(adAccounts)
      .where(eq(adAccounts.id, adAccountId))
      .limit(1);
    return rows[0]?.clientId ?? null;
  }
}
