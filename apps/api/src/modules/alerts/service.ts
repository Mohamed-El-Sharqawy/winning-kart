import { problem } from "../../lib/problem";
import { runDetectionForAccount } from "../../detection/engine";
import type { Alert, Task } from "@wk/db";
import { severityToPriority } from "../tasks/service";
import type { TasksService } from "../tasks/service";
import type { AlertListFilter, AlertRow } from "./model";
import type { AlertsModel } from "./model";

export type AlertView = Omit<Alert, "priorityScore"> & {
  priorityScore: number;
  clientName: string;
};

export interface DetectOutcome {
  alerts: unknown;
  insights: unknown;
}

function effectiveStatus(alert: Pick<Alert, "status" | "snoozedUntil">): Alert["status"] {
  if (
    alert.status === "snoozed" &&
    alert.snoozedUntil !== null &&
    alert.snoozedUntil.getTime() < Date.now()
  ) {
    return "open";
  }
  return alert.status;
}

export class AlertsService {
  constructor(
    private readonly model: AlertsModel,
    private readonly tasks: TasksService
  ) {}

  async list(filter: AlertListFilter): Promise<AlertView[]> {
    const rows = await this.model.list(filter);
    return rows.map((row) => this.toView(row));
  }

  bell(): Promise<number> {
    return this.model.bellCount();
  }

  async acknowledge(id: string): Promise<void> {
    await this.requireAlert(id);
    await this.model.update(id, { status: "acknowledged" });
  }

  async snooze(id: string, hours: 1 | 24): Promise<void> {
    await this.requireAlert(id);
    const snoozedUntil = new Date(Date.now() + hours * 3600000);
    await this.model.update(id, { status: "snoozed", snoozedUntil });
  }

  async dismiss(id: string, reason: string): Promise<void> {
    await this.requireAlert(id);
    await this.model.update(id, { status: "dismissed", dismissedReason: reason });
  }

  async createTask(id: string): Promise<Task> {
    const alert = await this.requireAlert(id);
    if (alert.suppressedByTaskId !== null) {
      throw problem(409, "ALERT_ALREADY_LINKED", "Alert is already linked to a task");
    }
    const task = await this.tasks.create({
      title: alert.whatHappened,
      description: `${alert.whyItMatters} — ${alert.recommendedAction}`,
      clientId: alert.clientId,
      adAccountId: alert.adAccountId ?? undefined,
      entityLevel: alert.entityLevel,
      entityId: alert.entityId,
      entityName: alert.entityName,
      priority: severityToPriority(alert.severity),
      source: "alert",
      linkedAlertId: alert.id,
    });
    await this.model.update(id, { status: "suppressed", suppressedByTaskId: task.id });
    return task;
  }

  async detect(adAccountId: string): Promise<DetectOutcome> {
    if (!(await this.model.adAccountExists(adAccountId))) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No ad account with id ${adAccountId}`);
    }
    const result = await runDetectionForAccount(adAccountId);
    return { alerts: result.alerts, insights: result.insights };
  }

  private async requireAlert(id: string): Promise<Alert> {
    const alert = await this.model.findById(id);
    if (!alert) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No alert with id ${id}`);
    }
    return alert;
  }

  private toView(row: AlertRow): AlertView {
    return {
      ...row,
      status: effectiveStatus(row),
      priorityScore: Number(row.priorityScore),
    };
  }
}
