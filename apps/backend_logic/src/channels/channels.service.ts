import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async listChannels() {
    return this.prisma.channel.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        type: true,
        position: true,
        createdAt: true,
      },
    });
  }

  async createChannel(
    actor: { role: string; userId: string },
    dto: CreateChannelDto,
  ) {
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can create channels');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const channel = await tx.channel.create({
          data: {
            name: dto.name.trim(),
            type: dto.type,
            position: dto.position ?? 0,
            createdById: actor.userId,
          },
          select: {
            id: true,
            name: true,
            type: true,
            position: true,
            createdAt: true,
          },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: actor.userId,
            action: 'CHANNEL_CREATE',
            meta: {
              channelId: channel.id,
              name: channel.name,
              type: channel.type,
              position: channel.position,
            },
          },
        });

        return channel;
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException(
          'Channel with this name and type already exists',
        );
      }
      throw e;
    }
  }

  async updateChannel(
    actor: { role: string; userId: string },
    channelId: string,
    dto: UpdateChannelDto,
  ) {
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can update channels');
    }

    if (!dto.name && dto.position === undefined) {
      throw new BadRequestException('No fields provided for update');
    }

    return this.prisma.$transaction(async (tx) => {
      const before = await tx.channel.findUnique({
        where: { id: channelId },
        select: {
          id: true,
          name: true,
          type: true,
          position: true,
        },
      });

      if (!before) {
        throw new NotFoundException('Channel not found');
      }

      try {
        const after = await tx.channel.update({
          where: { id: channelId },
          data: {
            ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
            ...(dto.position !== undefined ? { position: dto.position } : {}),
          },
          select: {
            id: true,
            name: true,
            type: true,
            position: true,
            createdAt: true,
          },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: actor.userId,
            action: 'CHANNEL_UPDATE',
            meta: {
              channelId,
              before,
              after: {
                id: after.id,
                name: after.name,
                type: after.type,
                position: after.position,
              },
            },
          },
        });

        return after;
      } catch (e: any) {
        if (e?.code === 'P2002') {
          throw new ConflictException(
            'Channel with this name and type already exists',
          );
        }
        throw e;
      }
    });
  }

  async deleteChannel(
    actor: { role: string; userId: string },
    channelId: string,
  ) {
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can delete channels');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.channel.findUnique({
        where: { id: channelId },
        select: {
          id: true,
          name: true,
          type: true,
          position: true,
        },
      });

      if (!existing) {
        throw new NotFoundException('Channel not found');
      }

      // If Message.channel has onDelete: Cascade,
      // this will automatically remove all messages.
      await tx.channel.delete({
        where: { id: channelId },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'CHANNEL_DELETE',
          meta: {
            channelId: existing.id,
            name: existing.name,
            type: existing.type,
            position: existing.position,
          },
        },
      });

      return { ok: true };
    });
  }
}
