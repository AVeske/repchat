import { useEffect, useState } from "react";

export function useVoiceMedia() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);

  async function startMic(): Promise<MediaStream | null> {
    if (localStream) return localStream;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (err: any) {
      setError("Microphone permission denied or microphone unavailable");
      return null;
    }
  }

  function stopMic() {
    if (!localStream) return;

    localStream.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
  }

  function toggleMic() {
    setIsMicEnabled((prev) => !prev);
  }

  useEffect(() => {
    if (!localStream) return;

    for (const track of localStream.getAudioTracks()) {
      track.enabled = isMicEnabled;
    }
  }, [localStream, isMicEnabled]);

  return {
    localStream,
    error,
    startMic,
    stopMic,
    isMicEnabled,
    toggleMic,
  };
}
