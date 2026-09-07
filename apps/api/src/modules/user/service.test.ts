import { describe, expect, test } from "bun:test";
import { UserService } from "./service";
import {
  expectProblem,
  memoryModel,
  memoryState,
  seedUser,
} from "./service.fakes";

describe("UserService client assignment", () => {
  test("creating a client member without a client is 422 VALIDATION", async () => {
    const service = new UserService(memoryModel(memoryState()));
    await expectProblem(
      () =>
        service.createUser({
          email: "client@wk.test",
          password: "long-enough",
          displayName: "Client Person",
          role: "client",
          clientRoleTier: "admin",
        }),
      422,
      "VALIDATION"
    );
  });

  test("creating a client member with an unknown client is 422 INVALID_CLIENT", async () => {
    const service = new UserService(memoryModel(memoryState()));
    await expectProblem(
      () =>
        service.createUser({
          email: "client@wk.test",
          password: "long-enough",
          displayName: "Client Person",
          role: "client",
          clientRoleTier: "admin",
          clientId: "cli-404",
        }),
      422,
      "INVALID_CLIENT"
    );
  });

  test("creating a client member assigns the client", async () => {
    const state = memoryState({ "cli-1": "Maison Nour" });
    const service = new UserService(memoryModel(state));
    const created = await service.createUser({
      email: "client@wk.test",
      password: "long-enough",
      displayName: "Client Person",
      role: "client",
      clientRoleTier: "admin",
      clientId: "cli-1",
    });
    expect(state.assignments.get(created.id)).toBe("cli-1");
    expect(created.clientId).toBe("cli-1");
    expect(created.clientName).toBe("Maison Nour");
  });

  test("creating an agency member creates no assignment", async () => {
    const state = memoryState({ "cli-1": "Maison Nour" });
    const service = new UserService(memoryModel(state));
    const created = await service.createUser({
      email: "am@wk.test",
      password: "long-enough",
      displayName: "Agency Person",
      role: "admin",
      agencyRole: "account_manager",
    });
    expect(state.assignments.has(created.id)).toBe(false);
  });

  test("updating a client member to an agency role removes the assignment", async () => {
    const state = memoryState({ "cli-1": "Maison Nour" });
    const service = new UserService(memoryModel(state));
    const member = seedUser(state, { role: "client", clientRoleTier: "viewer" });
    state.assignments.set(member.id, "cli-1");
    const updated = await service.update(member.id, { role: "admin", agencyRole: "analyst" });
    expect(state.assignments.has(member.id)).toBe(false);
    expect(updated.clientId).toBeNull();
  });

  test("updating an agency member to a client role with a client creates the assignment", async () => {
    const state = memoryState({ "cli-1": "Maison Nour" });
    const service = new UserService(memoryModel(state));
    const member = seedUser(state, {});
    const updated = await service.update(member.id, {
      role: "client",
      clientRoleTier: "viewer",
      clientId: "cli-1",
    });
    expect(state.assignments.get(member.id)).toBe("cli-1");
    expect(updated.clientId).toBe("cli-1");
  });

  test("updating a client member keeps the existing client when none is provided", async () => {
    const state = memoryState({ "cli-1": "Maison Nour" });
    const service = new UserService(memoryModel(state));
    const member = seedUser(state, { role: "client", clientRoleTier: "admin" });
    state.assignments.set(member.id, "cli-1");
    await service.update(member.id, { displayName: "Renamed" });
    expect(state.assignments.get(member.id)).toBe("cli-1");
  });

  test("updating a legacy unassigned client member without a client is 422 VALIDATION", async () => {
    const state = memoryState({ "cli-1": "Maison Nour" });
    const service = new UserService(memoryModel(state));
    const member = seedUser(state, { role: "client", clientRoleTier: "admin" });
    await expectProblem(() => service.update(member.id, { displayName: "Renamed" }), 422, "VALIDATION");
  });

  test("reassigning a client member upserts the assignment", async () => {
    const state = memoryState({ "cli-1": "Maison Nour", "cli-2": "Dune Coffee" });
    const service = new UserService(memoryModel(state));
    const member = seedUser(state, { role: "client", clientRoleTier: "admin" });
    state.assignments.set(member.id, "cli-1");
    await service.update(member.id, { clientId: "cli-2" });
    expect(state.assignments.get(member.id)).toBe("cli-2");
  });

  test("updating a client member to an unknown client is 422 INVALID_CLIENT", async () => {
    const state = memoryState({ "cli-1": "Maison Nour" });
    const service = new UserService(memoryModel(state));
    const member = seedUser(state, { role: "client", clientRoleTier: "admin" });
    state.assignments.set(member.id, "cli-1");
    await expectProblem(() => service.update(member.id, { clientId: "cli-404" }), 422, "INVALID_CLIENT");
    expect(state.assignments.get(member.id)).toBe("cli-1");
  });
});
