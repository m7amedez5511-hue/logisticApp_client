import { post } from "./api";
import type { LoginPayload, LoginResponse } from "@/src/types/auth";



export const authService = {
  /**
   * Authenticate a user with email / phone / username + password.
   * Throws `ApiError` on network or credential failure.
   */
  login: (payload: LoginPayload) =>
    post<LoginResponse>("auth/login", payload),

  /**
   * Request a password reset email.
   */
  forgotPassword: (email: string) =>
    post<{ message: string }>("auth/forgot-password", { email }),

  /**
   * Confirm a password reset with a token.
   */
  resetPassword: (token: string, newPassword: string) =>
    post<{ message: string }>("auth/reset-password", { token, newPassword }),
};