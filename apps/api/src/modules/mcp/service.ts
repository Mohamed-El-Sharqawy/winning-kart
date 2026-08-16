import { ProblemError } from "../../lib/problem";
import type { McpTool, ToolContext } from "./tools";
import { ToolError, mcpToolByName, mcpTools } from "./tools";

export interface JsonRpcErrorBody {
  code: number;
  message: string;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcErrorBody;
}

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_NAME = "winning-kart";
const SERVER_VERSION = "1.0.0";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRequestId(value: unknown): value is string | number | null {
  return value === null || typeof value === "string" || typeof value === "number";
}

function result(id: string | number | null, value: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result: value };
}

function failure(id: string | number | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function toolMeta(tool: McpTool): {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
} {
  return { name: tool.name, description: tool.description, inputSchema: tool.inputSchema };
}

export class McpService {
  async handle(body: unknown, ctx: ToolContext): Promise<JsonRpcResponse> {
    const validRequest =
      isRecord(body) &&
      body.jsonrpc === "2.0" &&
      typeof body.method === "string" &&
      "id" in body &&
      isRequestId(body.id) &&
      (body.params === undefined || isRecord(body.params));
    if (!validRequest) {
      return failure(null, -32600, "Invalid Request");
    }
    const request = body as {
      id: string | number | null;
      method: string;
      params?: Record<string, unknown>;
    };
    const { id, method } = request;
    if (method === "initialize") {
      return result(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      });
    }
    if (method === "tools/list") {
      return result(id, { tools: mcpTools.map(toolMeta) });
    }
    if (method === "tools/call") {
      return this.callTool(request.params ?? {}, ctx, id);
    }
    return failure(id, -32601, "Method not found");
  }

  private async callTool(
    params: Record<string, unknown>,
    ctx: ToolContext,
    id: string | number | null
  ): Promise<JsonRpcResponse> {
    const name = params.name;
    const args = params.arguments;
    if (typeof name !== "string" || (args !== undefined && !isRecord(args))) {
      return failure(id, -32602, "Invalid params");
    }
    const tool = mcpToolByName.get(name);
    if (tool === undefined) {
      return failure(id, -32602, "Unknown tool");
    }
    try {
      const payload = await tool.handler(ctx, isRecord(args) ? args : {});
      return result(id, {
        content: [{ type: "text", text: JSON.stringify(payload ?? null) }],
      });
    } catch (error) {
      if (error instanceof ToolError) {
        return failure(id, error.code, error.message);
      }
      if (error instanceof ProblemError) {
        return failure(id, -32001, error.detail ?? error.title);
      }
      return failure(id, -32603, "Internal error");
    }
  }
}
