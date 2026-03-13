import { api } from "./client"; // <-- change if your shared API client file has a different name

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
export type UserStatus = "APPROVED" | "REJECTED" | "DISABLED"; // (non-pending only)

export type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
};

export async function adminListUsers(search?: string): Promise<AdminUserRow[]> {
  const res = await api.get("/admin/users", {
    params: search ? { search } : undefined,
  });
  return res.data;
}

export async function adminUpdateUserRole(userId: string, role: UserRole) {
  const res = await api.patch(`/admin/users/${userId}/role`, { role });
  return res.data;
}

export async function adminUpdateUserStatus(
  userId: string,
  status: UserStatus,
) {
  const res = await api.patch(`/admin/users/${userId}/status`, { status });
  return res.data;
}

export async function adminDeleteUser(userId: string) {
  const res = await api.delete(`/admin/users/${userId}`);
  return res.data;
}
