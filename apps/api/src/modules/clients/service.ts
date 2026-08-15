import type { Client } from "@wk/db";
import type { ClientsModel } from "./model";

export interface CreateClientInput {
  name: string;
  slug: string;
}

export type CreateClientResult =
  | { ok: true; client: Client }
  | { ok: false; reason: "slug_taken" };

export class ClientsService {
  constructor(private model: ClientsModel) {}

  list() {
    return this.model.listClients();
  }

  async create(input: CreateClientInput): Promise<CreateClientResult> {
    if (await this.model.slugTaken(input.slug)) {
      return { ok: false, reason: "slug_taken" };
    }
    try {
      const client = await this.model.insertClient({
        id: crypto.randomUUID(),
        name: input.name,
        slug: input.slug,
      });
      return { ok: true, client };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { ok: false, reason: "slug_taken" };
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
