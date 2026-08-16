import { asErrorClass } from "@/shared/lib/loose-api";

export class ApiCallError extends Error {
  readonly errorClass: string | null;

  constructor(message: string, errorClass: string | null) {
    super(message);
    this.name = "ApiCallError";
    this.errorClass = errorClass;
  }
}

export function callFailed(error: unknown, fallback: string): ApiCallError {
  return new ApiCallError(fallback, asErrorClass(error));
}

const ALREADY_LINKED_CLASSES = ["ALERT_ALREADY_LINKED", "INSIGHT_ALREADY_ACCEPTED"];

export function inlineErrorCopy(error: unknown): string {
  if (error instanceof ApiCallError && error.errorClass && ALREADY_LINKED_CLASSES.includes(error.errorClass)) {
    return "Already linked to a task";
  }
  return error instanceof Error ? error.message : "Something went wrong";
}
