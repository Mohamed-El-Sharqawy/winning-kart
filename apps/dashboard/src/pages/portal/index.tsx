import { Card } from "@/shared/components/Card";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { PortalShell } from "./components/PortalShell";

export function PortalPage() {
  const { displayName } = usePermissions();

  return (
    <PortalShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-volt-text">
          Good morning, {displayName ?? "there"}
        </h1>
        <Card title="Reports">
          <ul className="flex flex-col gap-2 text-sm text-volt-text-3">
            <li>Weekly performance — coming in M4</li>
            <li>Monthly summary — coming in M4</li>
          </ul>
        </Card>
        <p className="text-sm text-volt-text-3">Client portal lands in M4.</p>
      </div>
    </PortalShell>
  );
}
