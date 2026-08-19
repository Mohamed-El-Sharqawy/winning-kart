import { useEffect, useState } from "react";

const STORAGE_KEY = "wk.workspace.client";
const WORKSPACE_CLIENT_EVENT = "wk-workspace-client";

export interface WorkspaceClient {
  slug: string;
  name: string;
}

function isWorkspaceClient(value: unknown): value is WorkspaceClient {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.slug === "string" && entry.slug.length > 0 && typeof entry.name === "string";
}

export function readWorkspaceClient(): WorkspaceClient | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isWorkspaceClient(parsed) ? { slug: parsed.slug, name: parsed.name } : null;
  } catch {
    return null;
  }
}

function announceChange(): void {
  window.dispatchEvent(new Event(WORKSPACE_CLIENT_EVENT));
}

export function writeWorkspaceClient(entry: WorkspaceClient): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    return;
  }
  announceChange();
}

export function clearWorkspaceClient(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
  announceChange();
}

export function useWorkspaceClient(): WorkspaceClient | null {
  const [client, setClient] = useState<WorkspaceClient | null>(() => readWorkspaceClient());

  useEffect(() => {
    const sync = () => setClient(readWorkspaceClient());
    window.addEventListener(WORKSPACE_CLIENT_EVENT, sync);
    return () => window.removeEventListener(WORKSPACE_CLIENT_EVENT, sync);
  }, []);

  return client;
}
