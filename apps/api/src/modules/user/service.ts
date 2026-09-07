import { hash } from "bcryptjs";
import { problem } from "../../lib/problem";
import type { UserModel, UserUpdatePatch, UserView } from "./model";

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  role: "admin" | "client";
  agencyRole?: "owner" | "admin" | "account_manager" | "marketer" | "analyst";
  clientRoleTier?: "admin" | "viewer";
  clientId?: string;
}

export interface UpdateUserInput {
  displayName?: string;
  role?: "admin" | "client";
  agencyRole?: "owner" | "admin" | "account_manager" | "marketer" | "analyst" | null;
  clientRoleTier?: "admin" | "viewer" | null;
  clientId?: string | null;
  status?: "active" | "invited" | "suspended";
}

export class UserService {
  constructor(private model: UserModel) {}

  listUsers() {
    return this.model.listUsers();
  }

  async createUser(input: CreateUserInput): Promise<UserView> {
    if (await this.model.emailTaken(input.email)) {
      throw problem(409, "EMAIL_TAKEN", "A user with this email already exists");
    }
    const clientId = await this.resolveClientId(input.role, input.clientId, null);
    const passwordHash = await hash(input.password, 12);
    let user: UserView;
    try {
      user = await this.model.insertUser({
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
    return this.applyAssignment(user, clientId);
  }

  async update(id: string, input: UpdateUserInput): Promise<UserView> {
    const user = await this.requireUser(id);
    const role = input.role ?? user.role;
    const patch: UserUpdatePatch = {
      displayName: input.displayName,
      role: input.role,
      agencyRole: role === "client" ? null : input.agencyRole ?? user.agencyRole,
      clientRoleTier: role === "admin" ? null : input.clientRoleTier ?? user.clientRoleTier,
      status: input.status,
    };
    if (role === "client" && patch.clientRoleTier === null) {
      throw problem(422, "VALIDATION", "Client members require a client role tier");
    }
    const clientId =
      role === "client"
        ? await this.resolveClientId(role, input.clientId, await this.model.assignedClientId(id))
        : null;
    const updated = await this.model.update(id, patch);
    if (!updated) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No user with id ${id}`);
    }
    return this.applyAssignment(updated, clientId);
  }

  async remove(id: string, actorId: string): Promise<UserView> {
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

  private async resolveClientId(
    role: "admin" | "client",
    requested: string | null | undefined,
    current: string | null
  ): Promise<string | null> {
    if (role !== "client") {
      return null;
    }
    const clientId = requested ?? current;
    if (!clientId) {
      throw problem(422, "VALIDATION", "Client members require a client");
    }
    if (!(await this.model.clientExists(clientId))) {
      throw problem(422, "INVALID_CLIENT", "Assigned client does not exist");
    }
    return clientId;
  }

  private async applyAssignment(user: UserView, clientId: string | null): Promise<UserView> {
    if (clientId === null) {
      if (user.clientId !== null) {
        await this.model.deleteClientAssignment(user.id);
        return (await this.model.findById(user.id)) ?? user;
      }
      return user;
    }
    await this.model.upsertClientAssignment(user.id, clientId);
    return (await this.model.findById(user.id)) ?? user;
  }

  private async requireUser(id: string): Promise<UserView> {
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
