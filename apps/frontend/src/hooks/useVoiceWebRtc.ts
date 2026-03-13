import { useEffect, useMemo, useRef } from "react";
import { connectSocket } from "../ws/socket";
import { createPeerConnection } from "../voice/webrtc";

type Member = { id: string; username: string; joinedAt?: string };
type VoiceStateMap = Record<string, Member[]>;

type Props = {
  activeVoiceChannelId: string | null;
  voiceMembersByChannel: VoiceStateMap;
  localStream: MediaStream | null;
  myUserId: string | null;
  remoteAudioEnabled: boolean;
  remoteAudioVolume: number;
};

export function useVoiceWebRtc({
  activeVoiceChannelId,
  voiceMembersByChannel,
  localStream,
  myUserId,
  remoteAudioEnabled,
  remoteAudioVolume,
}: Props) {
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const membersInMyChannel = useMemo(() => {
    if (!activeVoiceChannelId) return [];
    return voiceMembersByChannel[activeVoiceChannelId] ?? [];
  }, [activeVoiceChannelId, voiceMembersByChannel]);

  function iShouldCreateOfferTo(remoteUserId: string) {
    if (!myUserId) return false;
    return myUserId < remoteUserId;
  }

  function ensureAudioElement(remoteUserId: string) {
    let el = audioElsRef.current.get(remoteUserId);
    if (!el) {
      el = document.createElement("audio");
      el.autoplay = true;
      el.muted = !remoteAudioEnabled;
      el.volume = remoteAudioVolume;
      document.body.appendChild(el);
      audioElsRef.current.set(remoteUserId, el);
    }

    return el;
  }

  function cleanupPeer(remoteUserId: string) {
    const pc = peersRef.current.get(remoteUserId);
    if (pc) {
      pc.close();
      peersRef.current.delete(remoteUserId);
    }

    const el = audioElsRef.current.get(remoteUserId);
    if (el) {
      el.srcObject = null;
      el.remove();
      audioElsRef.current.delete(remoteUserId);
    }
  }

  function getOrCreatePeer(remoteUserId: string, socket: any) {
    const existing = peersRef.current.get(remoteUserId);
    if (existing) return existing;

    if (!localStream || !activeVoiceChannelId) return null;

    const pc = createPeerConnection({
      localStream,
      onIceCandidate: (candidate) => {
        socket.emit("webrtc:ice", {
          toUserId: remoteUserId,
          channelId: activeVoiceChannelId,
          candidate,
        });
      },
      onRemoteStream: (stream) => {
        const audioEl = ensureAudioElement(remoteUserId);
        (audioEl as any).srcObject = stream;
        audioEl.muted = !remoteAudioEnabled;
      },
    });

    peersRef.current.set(remoteUserId, pc);
    return pc;
  }

  // Keep existing audio elements in sync with headset state
  useEffect(() => {
    for (const audioEl of audioElsRef.current.values()) {
      audioEl.muted = !remoteAudioEnabled;
    }
  }, [remoteAudioEnabled]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    if (!myUserId) return;

    const socket = connectSocket(token);

    const onOffer = async (data: {
      fromUserId: string;
      channelId: string;
      offer: any;
    }) => {
      if (!activeVoiceChannelId) return;
      if (data.channelId !== activeVoiceChannelId) return;

      if (iShouldCreateOfferTo(data.fromUserId)) {
        return;
      }

      const pc = getOrCreatePeer(data.fromUserId, socket);
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc:answer", {
        toUserId: data.fromUserId,
        channelId: activeVoiceChannelId,
        answer,
      });
    };

    const onAnswer = async (data: {
      fromUserId: string;
      channelId: string;
      answer: any;
    }) => {
      if (!activeVoiceChannelId) return;
      if (data.channelId !== activeVoiceChannelId) return;

      const pc = peersRef.current.get(data.fromUserId);
      if (!pc) return;

      if (pc.signalingState !== "have-local-offer") {
        return;
      }

      if (pc.currentRemoteDescription) {
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    };

    const onIce = async (data: {
      fromUserId: string;
      channelId: string;
      candidate: any;
    }) => {
      if (!activeVoiceChannelId) return;
      if (data.channelId !== activeVoiceChannelId) return;

      const pc = peersRef.current.get(data.fromUserId);
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch {
        // ignore candidate race issues for MVP
      }
    };

    socket.on("webrtc:offer", onOffer);
    socket.on("webrtc:answer", onAnswer);
    socket.on("webrtc:ice", onIce);

    return () => {
      socket.off("webrtc:offer", onOffer);
      socket.off("webrtc:answer", onAnswer);
      socket.off("webrtc:ice", onIce);
    };
  }, [activeVoiceChannelId, localStream, myUserId, remoteAudioEnabled]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    if (!activeVoiceChannelId) {
      for (const remoteId of peersRef.current.keys()) cleanupPeer(remoteId);
      return;
    }

    if (!localStream) return;
    if (!myUserId) return;

    const socket = connectSocket(token);

    const others = membersInMyChannel
      .map((m) => m.id)
      .filter((id) => id !== myUserId);

    for (const remoteId of peersRef.current.keys()) {
      if (!others.includes(remoteId)) cleanupPeer(remoteId);
    }

    (async () => {
      for (const remoteUserId of others) {
        if (!iShouldCreateOfferTo(remoteUserId)) continue;
        if (peersRef.current.has(remoteUserId)) continue;

        const pc = getOrCreatePeer(remoteUserId, socket);
        if (!pc) continue;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("webrtc:offer", {
          toUserId: remoteUserId,
          channelId: activeVoiceChannelId,
          offer,
        });
      }
    })();
  }, [
    activeVoiceChannelId,
    membersInMyChannel,
    localStream,
    myUserId,
    remoteAudioEnabled,
  ]);

  useEffect(() => {
    for (const audioEl of audioElsRef.current.values()) {
      audioEl.volume = remoteAudioVolume;
    }
  }, [remoteAudioVolume]);
}
