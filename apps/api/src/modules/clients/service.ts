import { problem } from "../../lib/problem";
import type { Client } from "@wk/db";
import type { ClientsModel } from "./model";

export interface CreateClientInput {
  name: string;
  slug: string;
}

export class ClientsService {
  constructor(private model: ClientsModel) {}

  list() {
    return this.model.listClients();
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
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw problem(409, "SLUG_TAKEN", "A client with this slug already exists");
      }
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}
