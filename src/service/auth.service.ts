import axios from "axios";
import type { LoginRequest, LoginResponse } from "@/src/types/auth";

const authApi = axios.create({
  baseURL: "/api/proxy",
  timeout: 20000,
});

export const authService = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const response = await authApi.post<LoginResponse>("/auth/login", payload);
    return response.data;
  },
};
