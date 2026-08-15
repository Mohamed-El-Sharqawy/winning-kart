import { hash } from "bcryptjs";
import { problem } from "../../lib/problem";
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

export class UserService {
  constructor(private model: UserModel) {}

  listUsers() {
    return this.model.listUsers();
  }

  async createUser(input: CreateUserInput): Promise<SafeUser> {
    if (await this.model.emailTaken(input.email)) {
      throw problem(409, "EMAIL_TAKEN", "A user with this email already exists");
    }
    const passwordHash = await hash(input.password, 12);
    try {
      return await this.model.insertUser({
        id: crypto.randomUUID(),
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        role: input.role,
        agencyRole: input.agencyRole ?? null,
        clientRoleTier: input.clientRoleTier ?? null,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw problem(409, "EMAIL_TAKEN", "A user with this email already exists");
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
