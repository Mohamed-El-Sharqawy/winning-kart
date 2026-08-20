import { treaty } from "@elysiajs/eden";
import type { App } from "api";

const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

export const api = treaty<App>(origin, { parseDate: false }).api;

export type ApiClient = typeof api;
