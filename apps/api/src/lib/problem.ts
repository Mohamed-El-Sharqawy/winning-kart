export type ProblemErrorClass =
  | "invalid_token"
  | "permission_denied"
  | "rate_limited"
  | "not_found"
  | "server_error"
  | "network_error";

export interface ProblemInit {
  status: number;
  code: string;
  title: string;
  detail?: string;
  errorClass?: ProblemErrorClass;
}

export interface ProblemResult {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code: string;
  errorClass?: ProblemErrorClass;
  errors?: Array<{ path: string; message: string }>;
  [key: string]: unknown;
}

const REASON_PHRASES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Content",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
};

export function reasonPhrase(status: number): string {
  return REASON_PHRASES[status] ?? "Error";
}

export class ProblemError extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string;
  readonly detail: string | undefined;
  readonly errorClass: ProblemErrorClass | undefined;

  constructor(init: ProblemInit) {
    super(init.detail ?? init.title);
    this.name = "ProblemError";
    this.status = init.status;
    this.code = init.code;
    this.title = init.title;
    this.detail = init.detail;
    this.errorClass = init.errorClass;
  }
}

export function problem(
  status: number,
  code: string,
  detail?: string,
  errorClass?: ProblemErrorClass
): ProblemError {
  return new ProblemError({ status, code, title: reasonPhrase(status), detail, errorClass });
}

export function problemResponse(init: ProblemInit, instance: string): ProblemResult {
  return {
    type: "about:blank",
    title: init.title,
    status: init.status,
    ...(init.detail !== undefined ? { detail: init.detail } : {}),
    instance,
    code: init.code,
    ...(init.errorClass !== undefined ? { errorClass: init.errorClass } : {}),
  };
}
