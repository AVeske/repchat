type Props = {
  onOpenSettings: () => void;
  activeVoiceChannelId: string | null;
  onDisconnectVoice: () => void;
  isMicEnabled: boolean;
  onToggleMic: () => void;
  isHeadsetEnabled: boolean;
  onToggleHeadset: () => void;
};

export default function AudioControls({
  onOpenSettings,
  activeVoiceChannelId,
  onDisconnectVoice,
  isMicEnabled,
  onToggleMic,
  isHeadsetEnabled,
  onToggleHeadset,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 shadow-xl shadow-slate-950/30">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Voice Controls
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onToggleMic}
          className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
            isMicEnabled
              ? "border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
              : "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
          }`}
        >
          {isMicEnabled ? "Mute Mic" : "Mic Off"}
        </button>

        <button
          onClick={onToggleHeadset}
          className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
            isHeadsetEnabled
              ? "border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
              : "border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
          }`}
        >
          {isHeadsetEnabled ? "Headset On" : "Headset Off"}
        </button>

        <button
          onClick={onOpenSettings}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
        >
          Settings
        </button>
      </div>

      <div className="mt-3">
        {activeVoiceChannelId ? (
          <button
            onClick={onDisconnectVoice}
            className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
          >
            Disconnect Voice
          </button>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-400">
            Not connected to voice
          </div>
        )}
      </div>
    </div>
  );
}
