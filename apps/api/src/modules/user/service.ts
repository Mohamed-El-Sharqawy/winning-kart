import { hash } from "bcryptjs";
import { problem } from "../../lib/problem";
import type { SafeUser } from "../auth/model";
import type { UserModel, UserUpdatePatch } from "./model";

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  role: "admin" | "client";
  agencyRole?: "owner" | "admin" | "account_manager" | "marketer" | "analyst";
  clientRoleTier?: "admin" | "viewer";
}

export interface UpdateUserInput {
  displayName?: string;
  role?: "admin" | "client";
  agencyRole?: "owner" | "admin" | "account_manager" | "marketer" | "analyst" | null;
  clientRoleTier?: "admin" | "viewer" | null;
  status?: "active" | "invited" | "suspended";
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

  async update(id: string, input: UpdateUserInput): Promise<SafeUser> {
    const user = await this.requireUser(id);
    const role = input.role ?? user.role;
    const patch: UserUpdatePatch = {
      ...input,
      agencyRole: role === "client" ? null : input.agencyRole ?? user.agencyRole,
      clientRoleTier: role === "admin" ? null : input.clientRoleTier ?? user.clientRoleTier,
    };
    if (role === "client" && patch.clientRoleTier === null) {
      throw problem(422, "VALIDATION", "Client members require a client role tier");
    }
    const updated = await this.model.update(id, patch);
    if (!updated) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No user with id ${id}`);
    }
    return updated;
  }

  async remove(id: string, actorId: string): Promise<SafeUser> {
    if (id === actorId) {
      throw problem(409, "CANNOT_DELETE_SELF", "You cannot delete your own account");
    }
    const user = await this.requireUser(id);
    try {
      await this.model.remove(id);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw problem(409, "USER_IN_USE", "This member is still referenced by clients or tasks");
      }
      throw error;
    }
    return user;
  }

  private async requireUser(id: string): Promise<SafeUser> {
    const user = await this.model.findById(id);
    if (!user) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No user with id ${id}`);
    }
    return user;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return isPgErrorCode(error, "23505");
}

function isForeignKeyViolation(error: unknown): boolean {
  return isPgErrorCode(error, "23503");
}

function isPgErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}
