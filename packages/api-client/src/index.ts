import { treaty } from "@elysiajs/eden";
import type { App } from "api";

const envApiUrl = import.meta.env.VITE_API_URL;
const origin = envApiUrl
  ? envApiUrl
  : typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000";

export const api = treaty<App>(origin, { fetch: { credentials: "include" }, parseDate: false }).api;

export type ApiClient = typeof api;
