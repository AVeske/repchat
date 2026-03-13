import { api } from "./client";

export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";

export type AuthUser = {
  id: string;
  username: string;
  role: Role;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await api.post("/auth/login", { email, password });
  return res.data as LoginResponse;
}
