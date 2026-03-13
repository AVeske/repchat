import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

import {
  applyBulkApprovals,
  listPendingApprovals,
  type ApprovalChange,
  type PendingUser,
} from "../api/adminApprovals";

import {
  adminDeleteUser,
  adminListUsers,
  adminUpdateUserRole,
  adminUpdateUserStatus,
  type AdminUserRow,
  type UserRole,
  type UserStatus,
} from "../api/adminUsers";

type View = "APPROVALS" | "USERS";

type RowDecision =
  | { kind: "NONE" }
  | { kind: "APPROVED" }
  | { kind: "REJECTED"; reason: string };

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();

  const [view, setView] = useState<View>("APPROVALS");

  const [pending, setPending] = useState<PendingUser[]>([]);
  const [decisions, setDecisions] = useState<Record<string, RowDecision>>({});
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalsApplying, setApprovalsApplying] = useState(false);

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSavingIds, setUsersSavingIds] = useState<Record<string, boolean>>(
    {},
  );

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "SUPER_ADMIN") {
      navigate("/app", { replace: true });
    }
  }, [user, navigate]);

  function logout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  async function refreshApprovals() {
    setApprovalsLoading(true);
    setError(null);
    try {
      const data = await listPendingApprovals();
      setPending(data);

      const initial: Record<string, RowDecision> = {};
      for (const u of data) initial[u.id] = { kind: "NONE" };
      setDecisions(initial);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load pending approvals");
    } finally {
      setApprovalsLoading(false);
    }
  }

  const approvalsSelectedCount = useMemo(() => {
    return Object.values(decisions).filter((d) => d.kind !== "NONE").length;
  }, [decisions]);

  async function applyApprovalChanges() {
    setError(null);

    const changes: ApprovalChange[] = [];

    for (const u of pending) {
      const d = decisions[u.id] ?? { kind: "NONE" };
      if (d.kind === "APPROVED") {
        changes.push({ userId: u.id, status: "APPROVED" });
      } else if (d.kind === "REJECTED") {
        const reason = d.reason?.trim() ?? "";
        if (!reason) {
          setError(
            `Rejected user "${u.username}" must have a rejection reason.`,
          );
          return;
        }
        changes.push({
          userId: u.id,
          status: "REJECTED",
          rejectedReason: reason,
        });
      }
    }

    if (changes.length === 0) {
      setError("No approval changes selected.");
      return;
    }

    setApprovalsApplying(true);
    try {
      await applyBulkApprovals(changes);
      await refreshApprovals();
    } catch (e: any) {
      setError(e?.message ?? "Failed to apply approval changes");
    } finally {
      setApprovalsApplying(false);
    }
  }

  async function refreshUsers() {
    setUsersLoading(true);
    setError(null);
    try {
      const data = await adminListUsers(
        search.trim() ? search.trim() : undefined,
      );
      setUsers(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }

  async function changeRole(row: AdminUserRow, role: UserRole) {
    setError(null);
    setUsersSavingIds((prev) => ({ ...prev, [row.id]: true }));
    try {
      const updated = await adminUpdateUserRole(row.id, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === row.id ? { ...u, role: updated.role } : u)),
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to update role");
      await refreshUsers();
    } finally {
      setUsersSavingIds((prev) => ({ ...prev, [row.id]: false }));
    }
  }

  async function changeStatus(row: AdminUserRow, status: UserStatus) {
    setError(null);
    setUsersSavingIds((prev) => ({ ...prev, [row.id]: true }));
    try {
      const updated = await adminUpdateUserStatus(row.id, status);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === row.id
            ? {
                ...u,
                status: updated.status,
                approvedAt: updated.approvedAt ?? u.approvedAt,
                rejectedAt: updated.rejectedAt ?? u.rejectedAt,
                rejectedReason: updated.rejectedReason ?? u.rejectedReason,
              }
            : u,
        ),
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to update status");
      await refreshUsers();
    } finally {
      setUsersSavingIds((prev) => ({ ...prev, [row.id]: false }));
    }
  }

  async function deleteUser(row: AdminUserRow) {
    const ok = window.confirm(`Anonymize + disable user "${row.username}"?`);
    if (!ok) return;

    setError(null);
    setUsersSavingIds((prev) => ({ ...prev, [row.id]: true }));
    try {
      await adminDeleteUser(row.id);
      setUsers((prev) => prev.filter((u) => u.id !== row.id));
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete user");
      await refreshUsers();
    } finally {
      setUsersSavingIds((prev) => ({ ...prev, [row.id]: false }));
    }
  }

  useEffect(() => {
    refreshApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-7xl rounded-3xl border border-slate-800/80 bg-slate-950/75 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Admin Panel
            </h1>
            <p className="mt-1 text-sm text-slate-400">SUPER_ADMIN controls</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView("APPROVALS")}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                view === "APPROVALS"
                  ? "bg-blue-500 text-white"
                  : "border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              Approvals
            </button>

            <button
              onClick={() => setView("USERS")}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                view === "USERS"
                  ? "bg-blue-500 text-white"
                  : "border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              Users
            </button>

            <button
              onClick={logout}
              className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {view === "APPROVALS" ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={refreshApprovals}
                disabled={approvalsLoading}
                className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                {approvalsLoading ? "Loading…" : "Refresh"}
              </button>

              <button
                onClick={applyApprovalChanges}
                disabled={
                  approvalsApplying ||
                  approvalsLoading ||
                  pending.length === 0 ||
                  approvalsSelectedCount === 0
                }
                className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {approvalsApplying
                  ? "Applying…"
                  : `Apply changes (${approvalsSelectedCount})`}
              </button>

              <span className="text-sm text-slate-400">
                Pending users: {pending.length}
              </span>
            </div>

            {pending.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4 text-sm text-slate-400">
                No pending users 🎉
              </div>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-slate-800/80 bg-slate-900/50">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className={th}>User</th>
                      <th className={th}>Email</th>
                      <th className={th}>Created</th>
                      <th className={th}>Decision</th>
                      <th className={th}>Reject reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((u) => {
                      const d = decisions[u.id] ?? { kind: "NONE" as const };
                      const isReject = d.kind === "REJECTED";

                      return (
                        <tr
                          key={u.id}
                          className="border-b border-slate-800/60 last:border-0"
                        >
                          <td className={td}>
                            <div className="font-semibold text-slate-100">
                              {u.username}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {u.id}
                            </div>
                          </td>
                          <td className={td}>{u.email}</td>
                          <td className={td}>
                            {new Date(u.createdAt).toLocaleString()}
                          </td>
                          <td className={td}>
                            <select
                              value={d.kind}
                              onChange={(e) => {
                                const v = e.target.value as RowDecision["kind"];
                                if (v === "NONE")
                                  setDecisions((prev) => ({
                                    ...prev,
                                    [u.id]: { kind: "NONE" },
                                  }));
                                if (v === "APPROVED")
                                  setDecisions((prev) => ({
                                    ...prev,
                                    [u.id]: { kind: "APPROVED" },
                                  }));
                                if (v === "REJECTED") {
                                  setDecisions((prev) => ({
                                    ...prev,
                                    [u.id]: {
                                      kind: "REJECTED",
                                      reason: isReject ? (d as any).reason : "",
                                    },
                                  }));
                                }
                              }}
                              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none"
                            >
                              <option value="NONE">No change</option>
                              <option value="APPROVED">Approve</option>
                              <option value="REJECTED">Reject</option>
                            </select>
                          </td>
                          <td className={td}>
                            <input
                              value={isReject ? (d as any).reason : ""}
                              onChange={(e) =>
                                setDecisions((prev) => ({
                                  ...prev,
                                  [u.id]: {
                                    kind: "REJECTED",
                                    reason: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Required if rejecting"
                              disabled={!isReject}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 disabled:opacity-40"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username or email"
                className="min-w-[260px] rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />

              <button
                onClick={refreshUsers}
                disabled={usersLoading}
                className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                {usersLoading ? "Loading…" : "Search / Refresh"}
              </button>

              <span className="text-sm text-slate-400">
                Users: {users.length}
              </span>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-800/80 bg-slate-900/50">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className={th}>User</th>
                    <th className={th}>Email</th>
                    <th className={th}>Role</th>
                    <th className={th}>Status</th>
                    <th className={th}>Last login</th>
                    <th className={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const saving = !!usersSavingIds[u.id];
                    const isSelf = user?.id === u.id;

                    return (
                      <tr
                        key={u.id}
                        className="border-b border-slate-800/60 last:border-0"
                      >
                        <td className={td}>
                          <div className="font-semibold text-slate-100">
                            {u.username}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {u.id}
                          </div>
                        </td>

                        <td className={td}>{u.email}</td>

                        <td className={td}>
                          <select
                            value={u.role}
                            disabled={saving || isSelf}
                            onChange={(e) =>
                              changeRole(u, e.target.value as UserRole)
                            }
                            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none disabled:opacity-50"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        </td>

                        <td className={td}>
                          <select
                            value={u.status}
                            disabled={saving}
                            onChange={(e) =>
                              changeStatus(u, e.target.value as UserStatus)
                            }
                            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none disabled:opacity-50"
                          >
                            <option value="APPROVED">APPROVED</option>
                            <option value="DISABLED">DISABLED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>

                          {u.status === "REJECTED" && u.rejectedReason && (
                            <div className="mt-2 text-xs text-slate-400">
                              Reason: {u.rejectedReason}
                            </div>
                          )}
                        </td>

                        <td className={td}>
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleString()
                            : "-"}
                        </td>

                        <td className={td}>
                          <button
                            disabled={saving}
                            onClick={() => deleteUser(u)}
                            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                          >
                            Anonymize + Disable
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {users.length === 0 && (
                    <tr>
                      <td className={td} colSpan={6}>
                        <div className="text-sm text-slate-400">
                          No users found
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const th =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500";

const td = "px-4 py-4 align-top text-sm text-slate-300";
