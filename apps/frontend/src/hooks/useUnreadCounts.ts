import { useEffect, useState } from "react";
import { connectSocket } from "../ws/socket";

type UnreadMap = Record<string, number>;

export function useUnreadCounts(selectedChannelId: string | null) {
  const [unread, setUnread] = useState<UnreadMap>({});

  function clearUnread(channelId: string) {
    setUnread((prev) => {
      if (!prev[channelId]) return prev;
      const next = { ...prev };
      delete next[channelId];
      return next;
    });
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = connectSocket(token);

    const handler = (data: { channelId: string; message: any }) => {
      const channelId = data?.channelId;
      if (!channelId) return;

      if (selectedChannelId && channelId === selectedChannelId) return;

      setUnread((prev) => ({
        ...prev,
        [channelId]: (prev[channelId] ?? 0) + 1,
      }));
    };
    socket.on("message:created", handler);

    return () => {
      socket.off("message:created", handler);
    };
  }, [selectedChannelId]);

  return { unread, clearUnread };
}
