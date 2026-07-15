import { post } from "./api";
import type { LoginRequest, LoginResponse } from "@/src/types/auth";

export const authService = {
  /**
   * POST /auth/login
   * الـ payload لازم يحتوي على حقل واحد محدد النوع (email | phone | userName)
   * بالإضافة لـ password — مش حقل عام اسمه identity. useAuth.ts هو المسؤول
   * عن تحديد الحقل الصحيح عن طريق detectIdentityField() قبل استدعاء login().
   * (كان هذا الـ contract سابقًا في src/service/auth.service.ts عبر axios؛
   * تم نقله هنا بنفس الـ endpoint تمامًا — resolveBase() هنا بترجع "/api/proxy"
   * من ناحية الـ client، وهو نفس baseURL اللي كان axios شغال بيه، فالـ URL
   * النهائي "/api/proxy/auth/login" لم يتغير.)
   */
  login: (payload: LoginRequest) =>
    post<LoginResponse>("auth/login", payload),

  forgotPassword: (email: string) =>
    post<{ message: string }>("auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    post<{ message: string }>("auth/reset-password", { token, newPassword }),
};