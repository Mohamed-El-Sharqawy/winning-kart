import { ClientApiError } from "@/shared/services/clients.service";

export function clientFormError(error: unknown, fallback: string): string {
  if (error instanceof ClientApiError) {
    if (error.errorClass === "SLUG_TAKEN") return "That slug is already taken";
    if (error.errorClass === "VALIDATION") return "Check the fields";
    if (error.errorClass === "SLUG_MISMATCH") return "Slug mismatch — type the slug exactly as shown.";
    if (error.errorClass === "NOT_FOUND") return "Client not found";
  }
  return error instanceof Error && error.message.length > 0 ? error.message : fallback;
}
