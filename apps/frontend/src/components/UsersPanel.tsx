import { useEffect, useState } from "react";
import { listUsers, type UserListItem } from "../api/users";
import { usePresence } from "../hooks/usePresence";
import AvatarCircle from "./AvatarCircle";

export default function UsersPanel() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { onlineUserIds } = usePresence();

  async function refreshUsers() {
    try {
      setError(null);
      const data = await listUsers();
      setUsers(data);
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? "Failed to load users";
      const msg = Array.isArray(raw) ? raw.join(" • ") : String(raw);
      setError(msg);
    }
  }

  useEffect(() => {
    refreshUsers();
  }, []);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-800/80 bg-slate-950/65 p-4 shadow-2xl shadow-slate-950/30">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Members
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {users.length} users
          </div>
        </div>

        <button
          onClick={refreshUsers}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {users.map((u) => {
          const isOnline = onlineUserIds.has(u.id);

          return (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-2"
            >
              <AvatarCircle username={u.username} isOnline={isOnline} />

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-100">
                  {u.username}
                </div>
                <div className="text-xs text-slate-400">
                  {u.role} • {isOnline ? "online" : "offline"}
                </div>
              </div>
            </div>
          );
        })}

        {users.length === 0 && !error && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-3 py-3 text-sm text-slate-400">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}
