import { useEffect, useRef } from "react";
import type { Channel } from "../api/channels";
import { useChannelMessages } from "../hooks/useChannelMessages";
import AvatarCircle from "./AvatarCircle";
import { usePresence } from "../hooks/usePresence";
import { useAuth } from "../auth/AuthContext";

type Props = {
  selectedTextChannel: Channel | null;
};

export default function ChatWindow({ selectedTextChannel }: Props) {
  const channelId = selectedTextChannel?.id ?? null;

  const { user } = useAuth();

  const {
    messages,
    draft,
    setDraft,
    error,
    isLoading,
    isSending,
    canSend,
    refresh,
    send,
  } = useChannelMessages(channelId);

  const { onlineUserIds } = usePresence();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      send();
    }
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;

    const threshold = 50;
    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    shouldAutoScrollRef.current = isNearBottom;
  }

  function scrollToBottom() {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    scrollToBottom();
  }, [channelId]);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  if (!selectedTextChannel) {
    return (
      <div className="grid h-full place-items-center rounded-3xl border border-slate-800/80 bg-slate-950/65 shadow-2xl shadow-slate-950/30">
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-200">
            No chat selected
          </div>
          <div className="mt-2 text-sm text-slate-400">
            Choose a text channel from the left sidebar.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-800/80 bg-slate-950/65 shadow-2xl shadow-slate-950/30">
      <div className="border-b border-slate-800/80 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="m-0 text-lg font-semibold text-white">
              # {selectedTextChannel.name}
            </h3>
            <div className="mt-1 text-xs text-slate-400">TEXT channel</div>
          </div>

          <button
            onClick={refresh}
            disabled={isLoading}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            {isLoading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4"
      >
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {messages.map((m) => {
          const isOnline = onlineUserIds.has(m.user.id);
          const isMine = user?.id === m.user.id;

          return (
            <div
              key={m.id}
              className={`max-w-3xl rounded-2xl border px-4 py-3 shadow-lg shadow-slate-950/20 ${
                isMine
                  ? "border-blue-400/30 bg-blue-500/20 shadow-blue-900/30"
                  : "border-slate-800 bg-slate-900/80 shadow-slate-950-20"
              }`}
            >
              <div className="flex items-start gap-3">
                <AvatarCircle
                  username={m.user.username}
                  isOnline={isOnline}
                  size={30}
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">
                      {m.user.username}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {m.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!error && messages.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
            No messages yet
          </div>
        )}
      </div>

      <div className="border-t border-slate-800/80 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3">
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 bg-slate-950 text-slate-300 transition hover:bg-slate-800">
            +
          </button>

          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${selectedTextChannel.name}`}
            disabled={isSending}
            className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />

          <button
            onClick={send}
            disabled={!canSend}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
