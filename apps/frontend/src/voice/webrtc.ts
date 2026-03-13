import { getIceServers } from "./iceServers";

type CreatePeerArgs = {
  localStream: MediaStream;
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
  onRemoteStream: (stream: MediaStream) => void;
};

export function createPeerConnection({
  localStream,
  onIceCandidate,
  onRemoteStream,
}: CreatePeerArgs) {
  const pc = new RTCPeerConnection({
    iceServers: getIceServers(),
  });

  //Send ICE candidate to the other peer via your websocket signaling
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate.toJSON());
    }
  };

  //When remote audio track arrives, we get a MediaStream
  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) onRemoteStream(stream);
  };

  //Add local audio tracks(microphone) to the connection
  for (const track of localStream.getTracks()) {
    pc.addTrack(track, localStream);
  }

  return pc;
}
