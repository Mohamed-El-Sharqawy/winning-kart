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

export function memberFormError(error: unknown): string {
  if (error instanceof ApiCallError) {
    if (error.errorClass === "EMAIL_TAKEN") return "Email already taken";
    if (error.errorClass === "VALIDATION") return "Check the fields";
  }
  return error instanceof Error ? error.message : "Something went wrong";
}
