import type { SafeUser } from "../auth/model";
import type { ClientsModel } from "../clients/model";
import type { AdAccountsService } from "../ad-accounts/service";
import type { OverviewService } from "../overview/service";
import type { PortalModel } from "../portal/model";
import type { AlertsModel } from "../alerts/model";
import type { TasksService } from "../tasks/service";
import type { AdsListPage, AdsListQuery } from "../performance/ads-list";
import { readTools } from "./tools-read";
import { metricsTools } from "./tools-metrics";
import { writeTools } from "./tools-write";

export interface McpModels {
  clients: ClientsModel;
  adAccounts: AdAccountsService;
  overview: OverviewService;
  portal: PortalModel;
  alerts: AlertsModel;
  tasks: TasksService;
  adsList: (accountId: string, query: AdsListQuery) => Promise<AdsListPage>;
}

export interface ToolContext {
  user: SafeUser;
  models: McpModels;
}

export class ToolError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = "ToolError";
    this.code = code;
  }
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (ctx: ToolContext, args: Record<string, unknown>) => Promise<unknown>;
}

export function invalidParams(): ToolError {
  return new ToolError(-32602, "Invalid params");
}

export function forbidden(): ToolError {
  return new ToolError(-32000, "forbidden");
}

export function requireString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || value.length === 0) {
    throw invalidParams();
  }
  return value;
}

export function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || value.length === 0) {
    throw invalidParams();
  }
  return value;
}

export function optionalNumber(args: Record<string, unknown>, key: string): number | undefined {
  const value = args[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidParams();
  }
  return value;
}

export function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}

export const mcpTools: McpTool[] = [...readTools, ...metricsTools, ...writeTools];

export const mcpToolByName: Map<string, McpTool> = new Map(
  mcpTools.map((tool) => [tool.name, tool])
);
