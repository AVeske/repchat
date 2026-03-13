import { api } from "./client";

export type RegisterResponse = {
  id: string;
  email: string;
  username: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "DISABLED";
};

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const res = await api.post("/auth/register", { username, email, password });
  return res.data as RegisterResponse;
}
