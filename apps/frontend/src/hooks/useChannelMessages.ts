import { useEffect, useMemo, useState } from "react";
import { createMessage, listMessages, type Message } from "../api/messages";
import { connectSocket } from "../ws/socket";

export function useChannelMessages(channelId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  async function refresh() {
    if (!channelId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await listMessages(channelId, 50);
      setMessages([...data].reverse());
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? "Failed to load messages";
      const msg = Array.isArray(raw) ? raw.join(" • ") : String(raw);
      setError(msg);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function send() {
    if (!channelId) return;

    const trimmed = draft.trim();
    if (!trimmed) return;

    setIsSending(true);
    setError(null);
    try {
      const created = await createMessage(channelId, trimmed);

      // Optimistic update: we append immediately.
      // If WebSocket also delivers the same message, we deduplicate by id.
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev;
        return [...prev, created];
      });

      setDraft("");
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? "Failed to send message";
      const msg = Array.isArray(raw) ? raw.join(" • ") : String(raw);
      setError(msg);
    } finally {
      setIsSending(false);
    }
  }

  // When channel changes, reset and load messages
  useEffect(() => {
    setMessages([]);
    setDraft("");
    setError(null);

    if (channelId) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  // WebSocket subscription: join/leave channel rooms + receive new messages
  useEffect(() => {
    if (!channelId) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const s = connectSocket(token);

    // Join the channel room
    s.emit("channel:join", { channelId });

    const handler = (data: { channelId: string; message: Message }) => {
      if (data.channelId !== channelId) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    };

    s.on("message:created", handler);

    return () => {
      // Leave room + remove listener
      s.emit("channel:leave", { channelId });
      s.off("message:created", handler);
    };
  }, [channelId]);

  const canSend = useMemo(() => {
    return Boolean(channelId) && Boolean(draft.trim()) && !isSending;
  }, [channelId, draft, isSending]);

  return {
    messages,
    draft,
    setDraft,
    error,
    isLoading,
    isSending,
    canSend,
    refresh,
    send,
  };
}
