import { api } from "@/lib/api-client";

interface EdenResult {
  data: unknown;
  error: unknown;
}

export interface LooseEndpoint {
  (param: string): LooseEndpoint;
  get(options?: { query?: Record<string, string | number> }): Promise<EdenResult>;
  post(body: unknown): Promise<EdenResult>;
  delete(body?: unknown): Promise<EdenResult>;
}

type LooseApi = LooseEndpoint & { [key: string]: LooseEndpoint };

export const looseApi = api as unknown as LooseApi;

export function asErrorClass(error: unknown): string | null {
  if (error && typeof error === "object" && "error" in error) {
    const value = (error as { error: unknown }).error;
    if (typeof value === "string") return value;
  }
  return null;
}
