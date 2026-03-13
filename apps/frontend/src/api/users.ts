import { api } from "./client";

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED" | "DISABLED";

export type UserListItem = {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
};

export async function listUsers(): Promise<UserListItem[]> {
  const res = await api.get("/users");
  return res.data as UserListItem[];
}
