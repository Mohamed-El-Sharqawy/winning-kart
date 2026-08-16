import type { Task } from "@wk/db";
import { recordAudit } from "../../lib/audit";
import { McpTool, forbidden, invalidParams, optionalString, requireString } from "./tools";

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const createTask: McpTool = {
  name: "create_task",
  description: "Create a manual task (agency role only)",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      clientId: { type: "string" },
      priority: { type: "string", enum: [...PRIORITIES] },
    },
    required: ["title"],
  },
  handler: async (ctx, args) => {
    if (ctx.user.role === "client") {
      throw forbidden();
    }
    const title = requireString(args, "title");
    const description = optionalString(args, "description");
    const clientId = optionalString(args, "clientId");
    const rawPriority = optionalString(args, "priority");
    let priority: Task["priority"] | undefined;
    if (rawPriority !== undefined) {
      if (!(PRIORITIES as readonly string[]).includes(rawPriority)) {
        throw invalidParams();
      }
      priority = rawPriority as Task["priority"];
    }
    if (clientId !== undefined) {
      const client = await ctx.models.portal.findClientById(clientId);
      if (client === null) {
        throw invalidParams();
      }
    }
    const task = await ctx.models.tasks.create({ title, description, clientId, priority });
    void recordAudit({
      actorUserId: ctx.user.id,
      action: "task.create_mcp",
      targetEntityType: "task",
      targetEntityId: task.id,
      newValue: { title: task.title, clientId: task.clientId, priority: task.priority },
    });
    return task;
  },
};

const syncAdAccount: McpTool = {
  name: "sync_ad_account",
  description: "Run a full sync of one ad account and return per-stage results (admin only)",
  inputSchema: {
    type: "object",
    properties: { adAccountId: { type: "string" } },
    required: ["adAccountId"],
  },
  handler: async (ctx, args) => {
    if (ctx.user.role !== "admin") {
      throw forbidden();
    }
    const adAccountId = requireString(args, "adAccountId");
    return ctx.models.adAccounts.sync(adAccountId);
  },
};

export const writeTools: McpTool[] = [createTask, syncAdAccount];
