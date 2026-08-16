import { problem } from "../../lib/problem";
import type { Insight, Task } from "@wk/db";
import { severityToPriority } from "../tasks/service";
import type { TasksService } from "../tasks/service";
import type { InsightRow } from "./model";
import type { InsightsModel } from "./model";

export type InsightView = Omit<Insight, "deltaPct" | "priorityScore"> & {
  deltaPct: number | null;
  priorityScore: number;
  clientName: string;
};

export class InsightsService {
  constructor(
    private readonly model: InsightsModel,
    private readonly tasks: TasksService
  ) {}

  async list(clientId?: string): Promise<InsightView[]> {
    const rows = await this.model.list(clientId);
    return rows.map((row) => this.toView(row));
  }

  async accept(id: string): Promise<Task> {
    const insight = await this.requireInsight(id);
    if (insight.acceptedAsTaskId !== null) {
      throw problem(409, "INSIGHT_ALREADY_ACCEPTED", "Insight is already accepted as a task");
    }
    const task = await this.tasks.create({
      title: insight.headline,
      description:
        insight.primaryCause !== null
          ? `${insight.primaryCause} — ${insight.recommendedAction}`
          : insight.recommendedAction,
      clientId: insight.clientId,
      adAccountId: insight.adAccountId ?? undefined,
      entityLevel: insight.entityLevel,
      entityId: insight.entityId,
      entityName: insight.entityName,
      priority: severityToPriority(insight.severity),
      source: "recommendation",
      linkedInsightId: insight.id,
    });
    await this.model.markAccepted(id, task.id);
    return task;
  }

  async notUseful(id: string): Promise<void> {
    await this.requireInsight(id);
    await this.model.incrementNotUseful(id);
  }

  private async requireInsight(id: string): Promise<Insight> {
    const insight = await this.model.findById(id);
    if (!insight) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No insight with id ${id}`);
    }
    return insight;
  }

  private toView(row: InsightRow): InsightView {
    return {
      ...row,
      deltaPct: row.deltaPct === null ? null : Number(row.deltaPct),
      priorityScore: Number(row.priorityScore),
    };
  }
}
