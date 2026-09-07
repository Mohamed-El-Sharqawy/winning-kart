import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { ClientOwnershipModel } from "../portal/client-ownership";
import { requireOwnClientAccess } from "../portal/access";
import type { SafeUser } from "../auth/model";

export async function requireUser(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    throw problem(401, "UNAUTHENTICATED", "Authentication required");
  }
  return user;
}

export async function requireAdmin(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await requireUser(headers);
  if (user.role !== "admin") {
    throw problem(403, "FORBIDDEN", "Admin role required");
  }
  return user;
}

export const ownership = new ClientOwnershipModel();

export async function requireClientScopedList(
  headers: Record<string, string | undefined>,
  clientId: string
): Promise<SafeUser> {
  const user = await requireUser(headers);
  await requireOwnClientAccess(user, ownership, clientId);
  return user;
}
