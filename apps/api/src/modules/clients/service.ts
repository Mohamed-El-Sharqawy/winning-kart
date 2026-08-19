import { problem } from "../../lib/problem";
import type { ProblemError } from "../../lib/problem";
import type { Client, clients } from "@wk/db";
import type { ClientsModel } from "./model";

export type ClientStatus = "active" | "paused" | "archived";

export interface CreateClientInput {
  name: string;
  slug: string;
  industry?: string | null;
  displayCurrency?: string;
}

export interface UpdateClientInput {
  name?: string;
  slug?: string;
  industry?: string | null;
  status?: ClientStatus;
  displayCurrency?: string;
  assignedAccountManagerUserId?: string | null;
  primaryContactUserId?: string | null;
}

function clientNotFound(id: string): ProblemError {
  return problem(404, "RESOURCE_NOT_FOUND", `No client with id ${id}`);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export class ClientsService {
  constructor(private model: ClientsModel) {}

  list() {
    return this.model.listClients();
  }

  async detail(id: string): Promise<Client> {
    const client = await this.model.findById(id);
    if (!client) {
      throw clientNotFound(id);
    }
    return client;
  }

  async create(input: CreateClientInput): Promise<Client> {
    if (await this.model.slugTaken(input.slug)) {
      throw problem(409, "SLUG_TAKEN", "A client with this slug already exists");
    }
    try {
      return await this.model.insertClient({
        id: crypto.randomUUID(),
        name: input.name,
        slug: input.slug,
        industry: input.industry ?? null,
        displayCurrency: input.displayCurrency,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw problem(409, "SLUG_TAKEN", "A client with this slug already exists");
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateClientInput): Promise<Client> {
    const client = await this.model.findById(id);
    if (!client) {
      throw clientNotFound(id);
    }
    const patch: Partial<typeof clients.$inferInsert> = {};
    if (input.name !== undefined) {
      patch.name = input.name;
    }
    if (input.slug !== undefined) {
      patch.slug = input.slug;
    }
    if (input.industry !== undefined) {
      patch.industry = input.industry;
    }
    if (input.status !== undefined) {
      patch.status = input.status;
    }
    if (input.displayCurrency !== undefined) {
      patch.displayCurrency = input.displayCurrency;
    }
    if (input.assignedAccountManagerUserId !== undefined) {
      patch.assignedAccountManagerUserId = input.assignedAccountManagerUserId;
    }
    if (input.primaryContactUserId !== undefined) {
      patch.primaryContactUserId = input.primaryContactUserId;
    }
    if (Object.keys(patch).length === 0) {
      throw problem(422, "VALIDATION", "No fields to update");
    }
    if (
      input.assignedAccountManagerUserId !== undefined &&
      input.assignedAccountManagerUserId !== null &&
      !(await this.model.adminUserExists(input.assignedAccountManagerUserId))
    ) {
      throw problem(422, "INVALID_ASSIGNEE", "Assignee must be an agency user");
    }
    if (input.slug !== undefined && input.slug !== client.slug) {
      if (await this.model.slugTaken(input.slug)) {
        throw problem(409, "SLUG_TAKEN", "A client with this slug already exists");
      }
    }
    try {
      const updated = await this.model.updateClient(id, patch);
      if (!updated) {
        throw clientNotFound(id);
      }
      return updated;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw problem(409, "SLUG_TAKEN", "A client with this slug already exists");
      }
      throw error;
    }
  }

  async remove(id: string, confirmSlug: string): Promise<void> {
    const client = await this.model.findById(id);
    if (!client) {
      throw clientNotFound(id);
    }
    if (confirmSlug !== client.slug) {
      throw problem(422, "SLUG_MISMATCH", "confirmSlug does not match the client slug");
    }
    const deleted = await this.model.deleteClient(id);
    if (!deleted) {
      throw clientNotFound(id);
    }
  }
}
