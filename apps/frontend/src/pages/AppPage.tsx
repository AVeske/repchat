import { useState } from "react";
import type { Channel } from "../api/channels";
import { createChannel } from "../api/channels";

import AppLayout from "../components/AppLayout";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import UsersPanel from "../components/UsersPanel";
import CreateChannelModal from "../components/CreateChannelModal";
import AudioSettingsModal from "../components/AudioSettingsModal";

import { useUnreadCounts } from "../hooks/useUnreadCounts";
import { useVoiceState } from "../hooks/useVoiceState";
import { connectSocket } from "../ws/socket";
import { useVoiceMedia } from "../hooks/useVoiceMedia";
import { useVoiceWebRtc } from "../hooks/useVoiceWebRtc";
import { useAuth } from "../auth/AuthContext";

export default function AppPage() {
  const { user } = useAuth();

  const [selectedTextChannel, setSelectedTextChannel] =
    useState<Channel | null>(null);
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<
    string | null
  >(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);

  const [sidebarKey, setSidebarKey] = useState(0);

  const selectedChannelId = selectedTextChannel?.id ?? null;
  const { unread, clearUnread } = useUnreadCounts(selectedChannelId);

  const { voiceMembersByChannel } = useVoiceState();

  const [inputVolume, setInputVolume] = useState(100);
  const [outputVolume, setOutputVolume] = useState(100);

  const {
    localStream,
    error: micError,
    startMic,
    stopMic,
    isMicEnabled,
    toggleMic,
  } = useVoiceMedia();

  const [isHeadsetEnabled, setIsHeadsetEnabled] = useState(true);

  function toggleHeadset() {
    setIsHeadsetEnabled((prev) => !prev);
  }

  useVoiceWebRtc({
    activeVoiceChannelId,
    voiceMembersByChannel,
    localStream,
    myUserId: user?.id ?? null,
    remoteAudioEnabled: isHeadsetEnabled,
    remoteAudioVolume: outputVolume / 100,
  });

  async function handleJoinVoice(channelId: string) {
    const stream = await startMic();
    if (!stream) {
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = connectSocket(token);

    socket.emit(
      "voice:join",
      { channelId },
      (res: { activeVoiceChannelId?: string }) => {
        if (res?.activeVoiceChannelId) {
          setActiveVoiceChannelId(res.activeVoiceChannelId);
        } else {
          setActiveVoiceChannelId(channelId);
        }
      },
    );
  }

  function handleLeaveVoice() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      stopMic();
      setActiveVoiceChannelId(null);
      return;
    }

    const socket = connectSocket(token);

    socket.emit("voice:leave", {}, () => {
      setActiveVoiceChannelId(null);
      stopMic();
    });
  }

  return (
    <>
      <AppLayout
        top={<TopBar />}
        left={
          <Sidebar
            key={sidebarKey}
            selectedTextChannelId={selectedTextChannel?.id ?? null}
            onSelectTextChannel={(channel) => setSelectedTextChannel(channel)}
            unread={unread}
            clearUnread={clearUnread}
            onOpenCreateChannel={() => setIsCreateOpen(true)}
            onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
            activeVoiceChannelId={activeVoiceChannelId}
            onJoinVoice={(channelId) => handleJoinVoice(channelId)}
            onDisconnectVoice={() => handleLeaveVoice()}
            voiceMembersByChannel={voiceMembersByChannel}
            isMicEnabled={isMicEnabled}
            onToggleMic={toggleMic}
            isHeadsetEnabled={isHeadsetEnabled}
            onToggleHeadset={toggleHeadset}
          />
        }
        center={
          <div style={{ height: "100%" }}>
            {micError && (
              <div style={{ color: "crimson", marginBottom: 8 }}>
                {micError}
              </div>
            )}
            <ChatWindow selectedTextChannel={selectedTextChannel} />
          </div>
        }
        right={<UsersPanel />}
      />

      <CreateChannelModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={async (data) => {
          await createChannel({ name: data.name, type: data.type });
          setSidebarKey((k) => k + 1);
        }}
      />

      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
        inputVolume={inputVolume}
        onChangeInputVolume={setInputVolume}
        outputVolume={outputVolume}
        onChangeOutputVolume={setOutputVolume}
      />
    </>
  );
}
