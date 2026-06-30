import { ApiErrorResponse } from "@/src/types/role";

/**
 * Extracts a human-readable Arabic message from a backend error payload
 * shaped like ApiErrorResponse (validation_failed or other error codes).
 * Falls back to a generic message when the shape doesn't match.
 */
export function parseApiError(err: unknown, fallback: string): string {
  const body = (err as { body?: unknown })?.body ?? err;

  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    (body as ApiErrorResponse).error?.details?.length
  ) {
    const { details } = (body as ApiErrorResponse).error;
    // Surface the first field-level validation message
    return details.map((d) => `${d.field}: ${d.code}`).join(" — ");
  }

  if (body && typeof body === "object" && "message" in body) {
    return String((body as { message: string }).message);
  }

  return err instanceof Error ? err.message : fallback;
}