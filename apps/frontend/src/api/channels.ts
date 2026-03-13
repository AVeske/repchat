import { api } from "./client";

export type ChannelType = "TEXT" | "VOICE";

export type Channel = {
  id: string;
  name: string;
  type: ChannelType;
  position: number;
  createdAt: string;
};

export type CreateChannelRequest = {
  name: string;
  type: ChannelType;
  position?: number;
};

export type UpdatedChannelRequest = {
  name?: string;
  position?: number;
};

export async function listChannels(): Promise<Channel[]> {
  const res = await api.get("/channels");
  return res.data as Channel[];
}

export async function createChannel(
  dto: CreateChannelRequest,
): Promise<Channel> {
  const res = await api.post("/channels", dto);
  return res.data as Channel;
}

export async function updateChannel(
  id: string,
  dto: UpdatedChannelRequest,
): Promise<Channel> {
  const res = await api.patch(`/channels/${id}`, dto);
  return res.data as Channel;
}

export async function deleteChannel(id: string): Promise<{ ok: true }> {
  const res = await api.delete(`/channels/${id}`);
  return res.data as { ok: true };
}
