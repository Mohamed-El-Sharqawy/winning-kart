import { api } from "@/lib/api-client";

interface EdenResult {
  data: unknown;
  error: unknown;
}

interface LooseCallable {
  (param: string | Record<string, string | number>): LooseNode;
  get(options?: { query?: Record<string, string | number> }): Promise<EdenResult>;
  post(body: unknown): Promise<EdenResult>;
  delete(body?: unknown): Promise<EdenResult>;
}

interface LooseIndex {
  [key: string]: LooseNode;
}

type LooseNode = LooseCallable & LooseIndex;

export const looseApi = api as unknown as LooseNode;

export function asErrorClass(error: unknown): string | null {
  if (error && typeof error === "object") {
    const problem = error as { errorClass?: unknown; code?: unknown };
    if (typeof problem.errorClass === "string") return problem.errorClass;
    if (typeof problem.code === "string") return problem.code;
  }
  return null;
}
