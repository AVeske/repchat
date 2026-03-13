import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import AudioControls from "./AudioControls";
import type { Channel } from "../api/channels";
import { listChannels } from "../api/channels";
import AvatarCircle from "./AvatarCircle";
import type { VoiceStateMap } from "../hooks/useVoiceState";

type Props = {
  selectedTextChannelId: string | null;
  onSelectTextChannel: (channel: Channel) => void;
  unread: Record<string, number>;
  clearUnread: (channelId: string) => void;
  onOpenCreateChannel: () => void;
  onOpenAudioSettings: () => void;
  activeVoiceChannelId: string | null;
  onJoinVoice: (channelId: string) => void;
  onDisconnectVoice: () => void;
  voiceMembersByChannel: VoiceStateMap;
  isMicEnabled: boolean;
  onToggleMic: () => void;
  isHeadsetEnabled: boolean;
  onToggleHeadset: () => void;
};

export default function Sidebar({
  selectedTextChannelId,
  onSelectTextChannel,
  unread,
  clearUnread,
  onOpenCreateChannel,
  onOpenAudioSettings,
  activeVoiceChannelId,
  onJoinVoice,
  onDisconnectVoice,
  voiceMembersByChannel,
  isMicEnabled,
  onToggleMic,
  isHeadsetEnabled,
  onToggleHeadset,
}: Props) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refreshChannels() {
    try {
      setError(null);
      const data = await listChannels();
      setChannels(data);
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? "Failed to load channels";
      const msg = Array.isArray(raw) ? raw.join(" • ") : String(raw);
      setError(msg);
    }
  }

  useEffect(() => {
    refreshChannels();
  }, []);

  const textChannels = channels.filter((c) => c.type === "TEXT");
  const voiceChannels = channels.filter((c) => c.type === "VOICE");

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between px-1">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Channels
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {user?.role === "ADMIN" ? "Admin access" : "Member access"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={refreshChannels}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
          >
            Refresh
          </button>

          {user?.role === "ADMIN" && (
            <button
              onClick={onOpenCreateChannel}
              className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300 transition hover:bg-blue-500/20"
            >
              Create
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <section className="rounded-3xl border border-slate-800/80 bg-slate-950/65 p-3 shadow-xl shadow-slate-950/30">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Text Channels
          </div>

          <div className="space-y-2">
            {textChannels.map((c) => {
              const count = unread[c.id] ?? 0;

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    clearUnread(c.id);
                    onSelectTextChannel(c);
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
                    c.id === selectedTextChannelId
                      ? "border-blue-500/30 bg-blue-500/10 text-blue-200"
                      : "border-slate-800 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate text-sm font-medium">
                    # {c.name}
                  </span>

                  {count > 0 && (
                    <span className="min-w-6 rounded-full bg-red-500 px-2 py-0.5 text-center text-xs font-bold text-white">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {textChannels.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-400">
                No text channels
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800/80 bg-slate-950/65 p-3 shadow-xl shadow-slate-950/30">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Voice Channels
          </div>

          <div className="space-y-3">
            {voiceChannels.map((c) => {
              const members = voiceMembersByChannel[c.id] ?? [];

              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2"
                >
                  <button
                    onClick={() => onJoinVoice(c.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                      c.id === activeVoiceChannelId
                        ? "bg-blue-500/10 text-blue-200"
                        : "text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate text-sm font-medium">
                      🔊 {c.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {members.length}
                    </span>
                  </button>

                  {members.length > 0 && (
                    <div className="mt-2 space-y-2 pl-2">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 rounded-xl px-2 py-1"
                        >
                          <AvatarCircle username={m.username} size={22} />
                          <span className="truncate text-sm text-slate-300">
                            {m.username}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {voiceChannels.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-400">
                No voice channels
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="mt-4">
        <AudioControls
          onOpenSettings={onOpenAudioSettings}
          activeVoiceChannelId={activeVoiceChannelId}
          onDisconnectVoice={onDisconnectVoice}
          isMicEnabled={isMicEnabled}
          onToggleMic={onToggleMic}
          isHeadsetEnabled={isHeadsetEnabled}
          onToggleHeadset={onToggleHeadset}
        />
      </div>
    </div>
  );
}
