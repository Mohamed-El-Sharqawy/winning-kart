import { useSession } from "@/shared/services/session.service";

const ADMIN_WRITE_ROLES = new Set(["owner", "admin", "marketer"]);

export function usePermissions() {
  const { data: session } = useSession();
  const isAdmin = session?.role === "admin";
  return {
    isAdmin,
    canWrite: isAdmin,
    canManageTeam: isAdmin && session?.agencyRole !== undefined && ADMIN_WRITE_ROLES.has(session.agencyRole),
    isClient: session?.role === "client",
    displayName: session?.displayName,
    role: session?.role,
  };
}
