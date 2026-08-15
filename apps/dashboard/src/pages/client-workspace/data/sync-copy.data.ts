export const SYNC_STAGE_ORDER = [
  "account_info",
  "campaigns",
  "ad_sets",
  "ads",
  "insights",
  "daily_series",
] as const;

export const SYNC_STAGE_LABELS: Record<string, string> = {
  account_info: "Account info",
  campaigns: "Campaigns",
  ad_sets: "Ad sets",
  ads: "Ads",
  insights: "Insights",
  daily_series: "Daily series",
};

export const ERROR_COPY: Record<string, string> = {
  invalid_token: "Meta rejected the token — reconnect with a fresh system-user token",
  permission_denied: "Token lacks required scopes (ads_read, ads_management)",
  rate_limited: "Rate limited by Meta — retry shortly",
  not_found: "Ad account not found for this token",
  server_error: "Meta is unavailable — retrying later",
  network_error: "Network error reaching Meta",
};

export function errorCopy(errorClass: string | null | undefined): string {
  if (errorClass && ERROR_COPY[errorClass] !== undefined) return ERROR_COPY[errorClass];
  return "Something went wrong talking to the API — try again.";
}
