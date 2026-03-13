import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

type Actor = {
  userId: string;
  role: string;
};

@Injectable()
export class VoiceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Join a voice channel.
   *
   * Rules:
   * - Only USER and ADMIN can join voice
   * - Channel must exist and must be type VOICE
   * - User can be in only ONE voice channel at a time (enforced by @@unique([userId]))
   *   joining a new one automatically leaves the old one by updating the row.
   *
   * Returns:
   * - activeVoiceChannelId: the channel user is now in
   * - leftChannelId: previous channel id (or null)
   * - members: list of users currently in the new voice channel
   */
  async joinVoice(actor: Actor, channelId: string) {
    if (actor.role !== 'USER' && actor.role !== 'ADMIN') {
      throw new ForbiddenException('Not allowed');
    }

    if (!channelId || typeof channelId !== 'string') {
      throw new BadRequestException('channelId is required');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1) Ensure channel exists and is VOICE
      const channel = await tx.channel.findUnique({
        where: { id: channelId },
        select: { id: true, type: true },
      });

      if (!channel) throw new NotFoundException('Channel not found');
      if (channel.type !== 'VOICE') {
        throw new BadRequestException('Can only join VOICE channels');
      }

      // 2) Check current voice session for this user (unique by userId)
      const existing = await tx.voiceSession.findUnique({
        where: { userId: actor.userId },
        select: { channelId: true },
      });

      // If already in the same channel, do nothing (idempotent)
      if (existing?.channelId === channelId) {
        const members = await tx.voiceSession.findMany({
          where: { channelId },
          orderBy: { joinedAt: 'asc' },
          select: {
            user: { select: { id: true, username: true } },
            joinedAt: true,
          },
        });

        return {
          activeVoiceChannelId: channelId,
          leftChannelId: null as string | null,
          members: members.map((m) => ({
            id: m.user.id,
            username: m.user.username,
            joinedAt: m.joinedAt,
          })),
        };
      }

      const leftChannelId = existing?.channelId ?? null;

      // 3) Move/create the session to the new channel
      if (existing) {
        await tx.voiceSession.update({
          where: { userId: actor.userId },
          data: { channelId },
        });
      } else {
        await tx.voiceSession.create({
          data: { userId: actor.userId, channelId },
        });
      }

      // 4) Audit log (optional but consistent)
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'VOICE_JOIN',
          meta: {
            channelId,
            leftChannelId,
          },
        },
      });

      // 5) List members in the new channel
      const members = await tx.voiceSession.findMany({
        where: { channelId },
        orderBy: { joinedAt: 'asc' },
        select: {
          user: { select: { id: true, username: true } },
          joinedAt: true,
        },
      });

      return {
        activeVoiceChannelId: channelId,
        leftChannelId,
        members: members.map((m) => ({
          id: m.user.id,
          username: m.user.username,
          joinedAt: m.joinedAt,
        })),
      };
    });
  }

  /**
   * Leave voice entirely (disconnect).
   *
   * Returns:
   * - leftChannelIds: list of channels the user was removed from (0 or 1 due to @@unique([userId]))
   */
  async leaveVoice(actor: Actor) {
    if (actor.role !== 'USER' && actor.role !== 'ADMIN') {
      throw new ForbiddenException('Not allowed');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.voiceSession.findUnique({
        where: { userId: actor.userId },
        select: { channelId: true },
      });

      if (!existing) {
        return { leftChannelIds: [] as string[] };
      }

      await tx.voiceSession.delete({
        where: { userId: actor.userId },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'VOICE_LEAVE',
          meta: { leftChannelIds: [existing.channelId] },
        },
      });

      return { leftChannelIds: [existing.channelId] };
    });
  }

  /**
   * List members for a VOICE channel.
   * Used by the gateway when broadcasting current voice state.
   */
  async listVoiceMembers(channelId: string) {
    if (!channelId || typeof channelId !== 'string') {
      throw new BadRequestException('channelId is required');
    }

    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true, type: true },
    });

    if (!channel) throw new NotFoundException('Channel not found');
    if (channel.type !== 'VOICE') {
      throw new BadRequestException('Not a VOICE channel');
    }

    const members = await this.prisma.voiceSession.findMany({
      where: { channelId },
      orderBy: { joinedAt: 'asc' },
      select: {
        user: { select: { id: true, username: true } },
        joinedAt: true,
      },
    });

    return members.map((m) => ({
      id: m.user.id,
      username: m.user.username,
      joinedAt: m.joinedAt,
    }));
  }

  async listAllVoiceStates() {
    const sessions = await this.prisma.voiceSession.findMany({
      orderBy: { joinedAt: 'asc' },
      select: {
        channelId: true,
        joinedAt: true,
        user: { select: { id: true, username: true } },
      },
    });

    // Group into { [channelId]: members[] }
    const map: Record<
      string,
      { id: string; username: string; joinedAt: Date }[]
    > = {};

    for (const s of sessions) {
      if (!map[s.channelId]) map[s.channelId] = [];
      map[s.channelId].push({
        id: s.user.id,
        username: s.user.username,
        joinedAt: s.joinedAt,
      });
    }

    return map;
  }

  async getActiveVoiceCHannelId(userId: string): Promise<string | null> {
    const session = await this.prisma.voiceSession.findUnique({
      where: { userId },
      select: { channelId: true },
    });
    return session?.channelId ?? null;
  }
}
