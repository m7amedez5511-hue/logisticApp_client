// types.ts
// Types for normalizing raw backend error responses into Arabic-friendly UI errors.

// 1. Raw error response shape as returned by the backend.
export interface RawErrorResponse {
  success: false;
  message?: string | null;
  responseAt?: string;
  error?: {
    code?: string | null;
    path?: string | null;
    details?: unknown | null;
  } | null;
}

// 2. Which matcher produced the final message — useful for branching/logging.
export type ErrorKind = "known_message" | "unique_constraint" | "unknown";

// 3. Normalized, render-ready error shape. UI components only consume this.
export interface NormalizedError {
  success: false;
  message: string;   // final Arabic message to show
  code: string;       // original backend error code, kept for logging
  kind: ErrorKind;     // which matcher resolved this message
  field?: string;      // resolved field name, when applicable (unique constraints)
}