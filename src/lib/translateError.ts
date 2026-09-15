// translateError.ts
import type { NormalizedError } from "@/src/types/types";

// 1. Field name -> Arabic label (used for Prisma unique-constraint errors).
const FIELD_LABELS: Record<string, string> = {
  email: "البريد الإلكتروني",
  phone: "رقم الهاتف",
  userName: "اسم المستخدم",
  plateNumber: "رقم اللوحة",
  vinNumber: "رقم الهيكل",
  nationalId: "رقم الهوية",
};

// 2. Generic fallback — used when nothing else matches.
const FALLBACK_MESSAGE = "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.";

// 3. Known FIXED backend codes (auth / business-logic errors) — exact match.
//    Add new codes here as the backend introduces them.
const KNOWN_MESSAGES: Record<string, string> = {
  Password_Incorrect: "كلمة المرور غير صحيحة",
  User_Not_Found: "المستخدم غير موجود",
  Invalid_Credentials: "بيانات الدخول غير صحيحة",
  Account_Suspended: "تم إيقاف هذا الحساب، يرجى التواصل مع الدعم",
  Account_Inactive: "هذا الحساب غير مفعّل",
  Token_Expired: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى",
  Unauthorized: "غير مصرح لك بالوصول",
};

// 4. Regex to extract field name(s) from Prisma's unique-constraint message.
const UNIQUE_CONSTRAINT_RE = /Unique constraint failed on the fields:\s*\(`([^`]+)`\)/i;

// 5. Resolve Arabic label for a raw Prisma field name; safe default if unknown.
function resolveFieldLabel(field: string | null): string {
  if (!field) return "هذا الحقل";
  return FIELD_LABELS[field] ?? "هذا الحقل";
}

// 6. Build the Arabic sentence for a single unique-constraint failure.
function buildUniqueConstraintMessage(field: string | null): string {
  if (field === "email") return "هذا البريد الإلكتروني مسجل مسبقاً";
  if (field === "phone") return "رقم الهاتف مسجل مسبقاً";
  return `${resolveFieldLabel(field)} مسجل مسبقاً`;
}

// 7. Extract every failing field from a raw Prisma message (handles multi-field case).
function extractFailingFields(rawMessage: string): string[] {
  const match = rawMessage.match(UNIQUE_CONSTRAINT_RE);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((f) => f.trim().replace(/`/g, ""))
    .filter(Boolean);
}

// 8. Main entry point: normalize any raw error (or thrown Error) into NormalizedError.
export function translateError(raw: unknown): NormalizedError {
  // 8a. Accept either an Error instance (e.g. ApiError) or a raw response object.
  const rawMessage = raw instanceof Error
    ? raw.message
    : typeof (raw as { message?: unknown })?.message === "string"
      ? (raw as { message: string }).message
      : "";

  // 8b. Pull backend error code for logging, default to "unknown_error".
  const code = (raw as { error?: { code?: string } })?.error?.code ?? "unknown_error";

  // 8c. No message at all — nothing to parse.
  if (!rawMessage.trim()) {
    return { success: false, message: FALLBACK_MESSAGE, code, kind: "unknown" };
  }

  const trimmed = rawMessage.trim();

  // 8d. Check known FIXED codes first (Password_Incorrect, User_Not_Found, etc.).
  if (KNOWN_MESSAGES[trimmed]) {
    return { success: false, message: KNOWN_MESSAGES[trimmed], code, kind: "known_message" };
  }

  // 8e. Fall through to Prisma unique-constraint parsing.
  const fields = extractFailingFields(trimmed);

  // 8f. Not a recognized error shape — generic fallback.
  if (fields.length === 0) {
    return { success: false, message: FALLBACK_MESSAGE, code, kind: "unknown" };
  }

  // 8g. Single failing field — the common case (duplicate email/phone/etc).
  if (fields.length === 1) {
    return {
      success: false,
      message: buildUniqueConstraintMessage(fields[0]),
      code,
      kind: "unique_constraint",
      field: fields[0],
    };
  }

  // 8h. Multiple fields in one constraint — combine into one sentence.
  const labels = fields.map((f) => resolveFieldLabel(f));
  return {
    success: false,
    message: `البيانات التالية مسجلة مسبقاً: ${labels.join("، ")}`,
    code,
    kind: "unique_constraint",
    field: fields.join(","),
  };
}