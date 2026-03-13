import { api } from "./client";

export type PendingUser = {
  id: string;
  username: string;
  email: string;
  status: "PENDING";
  createdAt: string;
};

export type ApprovalChange =
  | { userId: string; status: "APPROVED" }
  | { userId: string; status: "REJECTED"; rejectedReason: string };

export async function listPendingApprovals(): Promise<PendingUser[]> {
  const res = await api.get("/admin/approvals/pending");
  return res.data;
}

export async function applyBulkApprovals(changes: ApprovalChange[]) {
  const res = await api.patch("/admin/approvals", {
    changes,
  });

  return res.data;
}
