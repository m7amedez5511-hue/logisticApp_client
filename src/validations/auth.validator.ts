import * as yup from "yup";

// phhone regex for saudi numbers
const saudiPhoneRegex = /^(\+966|966|0)?5[0-9]{8}$/;

function isEmail(value: string) {
  return yup.string().email().isValidSync(value);
}

function isPhone(value: string) {
  return saudiPhoneRegex.test(value);
}

function isUserName(value: string) {
  return value.length >= 2;
}

export function detectIdentityField(identity: string) {
  const value = identity.trim();

  if (!value) return null;
  if (isEmail(value)) return "email";
  if (isPhone(value)) return "phone";
  if (isUserName(value)) return "userName";
  return null;
}

/**
 * lopginSchema is a Yup validation schema for validating login form data. It checks that the identity field is either a valid email, a valid Saudi phone number, or a username with at least 2 characters. The password field must be at least 8 characters long.
 */
export const loginSchema = yup.object({
  identity: yup
    .string()
    .trim()
    .required("البريد الإلكتروني أو رقم الهاتف أو اسم المستخدم مطلوب")
    .test(
      "valid-identity",
      "يجب إدخال بريد إلكتروني صحيح أو رقم هاتف سعودي صحيح أو اسم مستخدم لا يقل عن حرفين",
      (value) => {
        if (!value) return false;
        return isEmail(value) || isPhone(value) || isUserName(value);
      }
    ),

  password: yup
    .string()
    .required("كلمة المرور مطلوبة")
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;