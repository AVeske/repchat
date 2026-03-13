import { useEffect, useState } from "react";
import { connectSocket } from "../ws/socket";

export type VoiceMember = {
  id: string;
  username: string;
  joinedAt: string; // ISO
};

export type VoiceStateMap = Record<string, VoiceMember[]>;

export function useVoiceState() {
  const [voiceMembersByChannel, setVoiceMembersByChannel] =
    useState<VoiceStateMap>({});

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = connectSocket(token);

    // 1) initial sync
    socket.emit("voice:sync", {}, (res: { states?: VoiceStateMap }) => {
      if (res?.states) {
        setVoiceMembersByChannel(res.states);
      }
    });

    // 2) live updates
    const onState = (data: { channelId: string; members: VoiceMember[] }) => {
      if (!data?.channelId) return;
      setVoiceMembersByChannel((prev) => ({
        ...prev,
        [data.channelId]: data.members,
      }));
    };

    socket.on("voice:state", onState);

    return () => {
      socket.off("voice:state", onState);
    };
  }, []);

  return { voiceMembersByChannel };
}
