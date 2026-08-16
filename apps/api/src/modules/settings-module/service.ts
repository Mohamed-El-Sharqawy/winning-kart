import { problem } from "../../lib/problem";
import type { Client, RetentionSetting } from "@wk/db";
import type { ExportBundle, SettingsModel } from "./model";

const DAY_MS = 86400000;

export class SettingsService {
  constructor(private readonly model: SettingsModel) {}

  async getRetention(): Promise<{ rawInsightsDays: number }> {
    const row = await this.ensureRetentionRow();
    return { rawInsightsDays: row.rawInsightsDays };
  }

  async updateRetention(rawInsightsDays: number): Promise<{ previous: number; current: number }> {
    const row = await this.ensureRetentionRow();
    const updated = await this.model.updateRetention(rawInsightsDays);
    return { previous: row.rawInsightsDays, current: updated.rawInsightsDays };
  }

  async applyRetention(): Promise<{ deleted: number }> {
    const row = await this.ensureRetentionRow();
    const cutoff = new Date(Date.now() - row.rawInsightsDays * DAY_MS)
      .toISOString()
      .slice(0, 10);
    const deleted = await this.model.deleteRawInsightsBefore(cutoff);
    return { deleted };
  }

  async findClientForDelete(id: string): Promise<Client> {
    const client = await this.model.findClientById(id);
    if (!client) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No client with id ${id}`);
    }
    return client;
  }

  async deleteClient(id: string, confirmSlug: string): Promise<void> {
    const client = await this.model.findClientById(id);
    if (!client) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No client with id ${id}`);
    }
    if (confirmSlug !== client.slug) {
      throw problem(422, "SLUG_MISMATCH", "confirmSlug does not match the client slug");
    }
    const deleted = await this.model.deleteClient(id);
    if (!deleted) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No client with id ${id}`);
    }
  }

  exportBundle(): Promise<ExportBundle> {
    return this.model.exportBundle();
  }

  private async ensureRetentionRow(): Promise<RetentionSetting> {
    const existing = await this.model.findRetention();
    if (existing) {
      return existing;
    }
    await this.model.insertDefaultRetention();
    const created = await this.model.findRetention();
    if (!created) {
      throw problem(500, "INTERNAL", "Failed to initialize retention settings");
    }
    return created;
  }
}
