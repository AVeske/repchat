import { api } from "./client";

export type Message = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
};

export async function listMessages(
  channelId: string,
  take = 50,
): Promise<Message[]> {
  const res = await api.get(`/channels/${channelId}/messages`, {
    params: { take },
  });
  return res.data as Message[];
}

export async function createMessage(
  channelid: string,
  content: string,
): Promise<Message> {
  const res = await api.post(`/channels/${channelid}/messages`, { content });
  return res.data as Message;
}
