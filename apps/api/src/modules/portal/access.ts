import { problem } from "../../lib/problem";
import type { SafeUser } from "../auth/model";
import type { PortalAccessModel } from "./client-ownership";

export async function requireAdAccountAccess(
  user: SafeUser,
  model: PortalAccessModel,
  adAccountId: string
): Promise<void> {
  if (user.role !== "client") {
    return;
  }
  const client = await model.findAssignedClient(user.id);
  if (client === null) {
    throw problem(403, "NO_CLIENT_ASSIGNMENT", "No client is assigned to this user");
  }
  const ownerClientId = await model.findClientIdForAdAccount(adAccountId);
  if (ownerClientId !== client.id) {
    throw problem(403, "FORBIDDEN", "This ad account does not belong to your business");
  }
}

export async function requireOwnClientAccess(
  user: SafeUser,
  model: PortalAccessModel,
  clientId: string
): Promise<void> {
  if (user.role !== "client") {
    return;
  }
  const client = await model.findAssignedClient(user.id);
  if (client === null) {
    throw problem(403, "NO_CLIENT_ASSIGNMENT", "No client is assigned to this user");
  }
  if (client.id !== clientId) {
    throw problem(403, "FORBIDDEN", "This client does not belong to your business");
  }
}
