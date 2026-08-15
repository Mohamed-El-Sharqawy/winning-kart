import { useSession } from "@/pages/auth/hooks/useAuth";

const ADMIN_WRITE_ROLES = new Set(["owner", "admin", "marketer"]);

export function usePermissions() {
  const { data: session } = useSession();
  const isAdmin = session?.role === "admin";
  return {
    isAdmin,
    canWrite: isAdmin,
    canManageTeam: isAdmin && ADMIN_WRITE_ROLES.has("admin"),
    isClient: session?.role === "client",
  };
}
