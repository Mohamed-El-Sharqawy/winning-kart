import { auditLogs, db } from "@wk/db";

export type AuditActorType = "user" | "api_token" | "system";
export type AuditOutcome = "success" | "failure";

export interface RecordAuditInput {
  actorUserId: string | null;
  actorType?: AuditActorType;
  action: string;
  targetEntityType?: string;
  targetEntityId?: string;
  outcome?: AuditOutcome;
  oldValue?: unknown;
  newValue?: unknown;
  request?: { ip?: string; userAgent?: string };
}

export function clientIp(headers: Record<string, string | undefined>): string | undefined {
  const forwarded = headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const first = forwarded.split(",")[0]?.trim();
    if (first !== undefined && first.length > 0) {
      return first;
    }
  }
  return undefined;
}

export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorUserId: input.actorUserId,
      actorType: input.actorType ?? "user",
      action: input.action,
      targetEntityType: input.targetEntityType ?? null,
      targetEntityId: input.targetEntityId ?? null,
      outcome: input.outcome ?? "success",
      oldValue: toJson(input.oldValue),
      newValue: toJson(input.newValue),
      ip: input.request?.ip ?? null,
      userAgent: input.request?.userAgent ?? null,
      occurredAt: new Date(),
    });
  } catch {
  }
}

function toJson(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }
  return value;
}
