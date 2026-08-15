import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import { StatusDot, healthDotVariant } from "@/shared/components/StatusDot";
import { formatRelativeTime } from "@/lib/format";
import type { AdAccount } from "../types/ad-accounts.types";

const ACTION_BUTTON = "px-2.5 py-1 text-xs";
const DAY_MS = 86_400_000;

function tokenBadge(account: AdAccount) {
  if (account.tokenType !== "user_60d") return null;
  if (!account.tokenExpiresAt) return <Badge variant="neutral">60-day</Badge>;
  const remainingMs = account.tokenExpiresAt.getTime() - Date.now();
  if (remainingMs <= 0) return <Badge variant="down">Expired</Badge>;
  const days = Math.ceil(remainingMs / DAY_MS);
  if (days <= 7) {
    return (
      <Badge variant="down">
        Expires in <span className="tabular">{days}d</span>
      </Badge>
    );
  }
  return <Badge variant="neutral">60-day</Badge>;
}

export interface AccountsTableProps {
  accounts: AdAccount[];
  onSync: (account: AdAccount) => void;
  onReconnect: (account: AdAccount) => void;
  onRemove: (account: AdAccount) => void;
  syncPendingId: string | null;
}

export function AccountsTable({ accounts, onSync, onReconnect, onRemove, syncPendingId }: AccountsTableProps) {
  const columns: Array<DataTableColumn<AdAccount>> = [
    {
      key: "name",
      header: "Name",
      render: (row) => <span className="font-medium text-volt-text">{row.name}</span>,
    },
    {
      key: "adAccountId",
      header: "Ad account",
      render: (row) => <span className="font-mono text-volt-text-3">{row.adAccountId}</span>,
    },
    {
      key: "platform",
      header: "Platform",
      render: (row) => <span className="capitalize">{row.platform}</span>,
    },
    {
      key: "healthState",
      header: "Status",
      render: (row) => (
        <StatusDot variant={healthDotVariant(row.healthState)}>
          {row.healthState.toLowerCase().replace(/_/g, " ")}
        </StatusDot>
      ),
    },
    {
      key: "token",
      header: "Token",
      render: (row) => tokenBadge(row),
    },
    { key: "currency", header: "Currency" },
    {
      key: "campaignCount",
      header: "Campaigns",
      align: "right",
      render: (row) => <span className="tabular">{row.campaignCount}</span>,
    },
    {
      key: "lastSyncAt",
      header: "Last sync",
      align: "right",
      render: (row) => <span className="text-volt-text-3">{formatRelativeTime(row.lastSyncAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            className={ACTION_BUTTON}
            disabled={syncPendingId === row.id}
            onClick={() => onSync(row)}
          >
            {syncPendingId === row.id ? "Syncing…" : "Sync now"}
          </Button>
          <Button variant="ghost" className={ACTION_BUTTON} onClick={() => onReconnect(row)}>
            Reconnect
          </Button>
          <Button variant="ghost-danger" className={ACTION_BUTTON} onClick={() => onRemove(row)}>
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} rows={accounts} rowKey={(row) => row.id} />;
}
