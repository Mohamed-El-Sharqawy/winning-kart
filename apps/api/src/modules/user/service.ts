import { hash } from "bcryptjs";
import type { SafeUser } from "../auth/model";
import type { UserModel } from "./model";

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  role: "admin" | "client";
  agencyRole?: "owner" | "admin" | "account_manager" | "marketer" | "analyst";
  clientRoleTier?: "admin" | "viewer";
}

export type CreateUserResult =
  | { ok: true; user: SafeUser }
  | { ok: false; reason: "email_taken" };

export class UserService {
  constructor(private model: UserModel) {}

  listUsers() {
    return this.model.listUsers();
  }

  async createUser(input: CreateUserInput): Promise<CreateUserResult> {
    if (await this.model.emailTaken(input.email)) {
      return { ok: false, reason: "email_taken" };
    }
    const passwordHash = await hash(input.password, 12);
    try {
      const user = await this.model.insertUser({
        id: crypto.randomUUID(),
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        role: input.role,
        agencyRole: input.agencyRole ?? null,
        clientRoleTier: input.clientRoleTier ?? null,
      });
      return { ok: true, user };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { ok: false, reason: "email_taken" };
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
