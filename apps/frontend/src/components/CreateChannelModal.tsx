import { useState } from "react";
import type { ChannelType } from "../api/channels";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; type: ChannelType }) => void | Promise<void>;
};

export default function CreateChannelModal({
  isOpen,
  onClose,
  onCreate,
}: Props) {
  const [type, setType] = useState<ChannelType>("TEXT");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleCreate() {
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Channel name is required.");
      return;
    }

    setError(null);

    await onCreate({
      name: trimmed,
      type,
    });

    setName("");
    setType("TEXT");
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Create Channel</h3>
            <p className="mt-1 text-sm text-slate-400">
              Choose a channel type and give it a name.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Channel Type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("TEXT")}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  type === "TEXT"
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-200"
                    : "border-slate-800 bg-slate-900/70 text-slate-300 hover:bg-slate-800"
                }`}
              >
                Text
              </button>

              <button
                type="button"
                onClick={() => setType("VOICE")}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  type === "VOICE"
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-200"
                    : "border-slate-800 bg-slate-900/70 text-slate-300 hover:bg-slate-800"
                }`}
              >
                Voice
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Channel Name
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. general"
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500/50"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              onClick={handleCreate}
              className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Create Channel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
