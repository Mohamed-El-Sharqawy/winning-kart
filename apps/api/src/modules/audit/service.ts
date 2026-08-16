import type { AuditLogFilters, AuditLogRow } from "./model";
import type { AuditModel } from "./model";

export interface AuditQuery {
  action?: string;
  actorUserId?: string;
  outcome?: string;
  days?: string;
}

const DAY_MS = 86400000;
const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;
const CSV_COLUMNS = [
  "id",
  "occurredAt",
  "actorType",
  "actorUserId",
  "action",
  "targetEntityType",
  "targetEntityId",
  "outcome",
  "ip",
] as const;

export class AuditService {
  constructor(private readonly model: AuditModel) {}

  list(query: AuditQuery): Promise<AuditLogRow[]> {
    return this.model.list(toFilters(query));
  }

  async exportCsv(query: AuditQuery): Promise<string> {
    const rows = await this.list(query);
    const lines = [CSV_COLUMNS.join(",")];
    for (const row of rows) {
      lines.push(
        [
          row.id,
          row.occurredAt.toISOString(),
          row.actorType,
          row.actorUserId ?? "",
          row.action,
          row.targetEntityType ?? "",
          row.targetEntityId ?? "",
          row.outcome,
          row.ip ?? "",
        ]
          .map(csvEscape)
          .join(",")
      );
    }
    return lines.join("\n");
  }
}

function toFilters(query: AuditQuery): AuditLogFilters {
  return {
    action: nonEmpty(query.action),
    actorUserId: nonEmpty(query.actorUserId),
    outcome: nonEmpty(query.outcome),
    since: new Date(Date.now() - parseDays(query.days) * DAY_MS),
  };
}

function parseDays(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? String(DEFAULT_DAYS), 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_DAYS;
  }
  return Math.min(Math.max(parsed, 1), MAX_DAYS);
}

function nonEmpty(value: string | undefined): string | undefined {
  return value !== undefined && value.length > 0 ? value : undefined;
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
