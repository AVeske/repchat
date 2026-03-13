import { useEffect, useState } from "react";
import { connectSocket } from "../ws/socket";

/**
 * Stores online user ids.
 * - Uses "presence:sync" to load current state
 * - Listens for "presence:online" and "presence:offline" events
 */
export function usePresence() {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = connectSocket(token);

    // 1) Ask server for current online users
    socket.emit("presence:sync", {}, (res: { onlineUserIds: string[] }) => {
      if (res?.onlineUserIds) {
        setOnlineUserIds(new Set(res.onlineUserIds));
      }
    });

    // 2) Listen for changes
    const onOnline = (data: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.add(data.userId);
        return next;
      });
    };

    const onOffline = (data: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    socket.on("presence:online", onOnline);
    socket.on("presence:offline", onOffline);

    return () => {
      socket.off("presence:online", onOnline);
      socket.off("presence:offline", onOffline);
    };
  }, []);

  return { onlineUserIds };
}
