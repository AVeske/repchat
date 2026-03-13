import { useAuth } from "../auth/AuthContext";

export default function TopBar() {
  const { user, clearAuth } = useAuth();

  return (
    <div className="flex h-16 items-center justify-between px-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 shadow-lg shadow-blue-900/30">
          <span className="text-lg font-bold text-white">R</span>
        </div>

        <div>
          <div className="text-lg font-semibold tracking-tight text-white">
            RepChat
          </div>
          <div className="text-xs text-slate-400">
            Private team messaging and voice
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 md:block">
          {user?.username} <span className="text-slate-500">•</span>{" "}
          {user?.role}
        </div>

        <button
          onClick={clearAuth}
          className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
