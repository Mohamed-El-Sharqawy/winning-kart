import { expect } from "bun:test";
import { ProblemError } from "../../lib/problem";
import type { UserModel, UserUpdatePatch, UserView } from "./model";

export function userView(overrides: Partial<UserView> = {}): UserView {
  return {
    id: "u-1",
    email: "member@wk.test",
    displayName: "Member",
    role: "admin",
    agencyRole: "admin",
    clientRoleTier: null,
    status: "active",
    lastActiveAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    clientId: null,
    clientName: null,
    ...overrides,
  };
}

export interface MemoryState {
  users: Map<string, UserView>;
  emails: Set<string>;
  clients: Map<string, string>;
  assignments: Map<string, string>;
  nextId: number;
}

export function memoryState(clients: Record<string, string> = {}): MemoryState {
  return {
    users: new Map(),
    emails: new Set(),
    clients: new Map(Object.entries(clients)),
    assignments: new Map(),
    nextId: 1,
  };
}

function derived(state: MemoryState, view: UserView): UserView {
  const clientId = state.assignments.get(view.id) ?? null;
  return { ...view, clientId, clientName: clientId ? (state.clients.get(clientId) ?? null) : null };
}

export function memoryModel(state: MemoryState): UserModel {
  return {
    listUsers: async () => [...state.users.values()].map((view) => derived(state, view)),
    findById: async (id: string) => {
      const view = state.users.get(id);
      return view ? derived(state, view) : null;
    },
    emailTaken: async (email: string) => state.emails.has(email),
    insertUser: async (input: { id: string; email: string; displayName: string }) => {
      const view = userView(input);
      state.users.set(view.id, view);
      state.emails.add(view.email);
      return view;
    },
    update: async (id: string, patch: UserUpdatePatch) => {
      const current = state.users.get(id);
      if (!current) {
        return null;
      }
      const view = userView({ ...current, ...patch, id: current.id });
      state.users.set(id, view);
      return derived(state, view);
    },
    remove: async (id: string) => {
      state.users.delete(id);
      state.assignments.delete(id);
    },
    clientExists: async (id: string) => state.clients.has(id),
    assignedClientId: async (userId: string) => state.assignments.get(userId) ?? null,
    upsertClientAssignment: async (userId: string, clientId: string) => {
      state.assignments.set(userId, clientId);
    },
    deleteClientAssignment: async (userId: string) => {
      state.assignments.delete(userId);
    },
  } as UserModel;
}

export function seedUser(state: MemoryState, view: Partial<UserView>): UserView {
  const full = userView({ id: `u-seed-${state.nextId++}`, ...view });
  state.users.set(full.id, full);
  state.emails.add(full.email);
  return full;
}

export function expectProblem(
  run: () => Promise<unknown>,
  status: number,
  code: string
): Promise<void> {
  return run().then(
    () => {
      throw new Error("expected a ProblemError");
    },
    (error) => {
      expect(error).toBeInstanceOf(ProblemError);
      expect((error as ProblemError).status).toBe(status);
      expect((error as ProblemError).code).toBe(code);
    }
  );
}
