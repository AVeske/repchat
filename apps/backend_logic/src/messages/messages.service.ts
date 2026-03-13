import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async listByChannel(channelId: string, take = 50) {
    //Take-limit safety
    const safeTake = Math.min(Math.max(take, 1), 100);

    //Ensure channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true },
    });
    if (!channel) throw new NotFoundException('Channel not found');

    //Newest first
    const messages = await this.prisma.message.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      take: safeTake,
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return messages;
  }

  async createMessage(
    actor: { userId: string; role: string },
    channelId: string,
    dto: CreateMessageDto,
  ) {
    if (actor.role !== 'USER' && actor.role !== 'ADMIN') {
      throw new ForbiddenException('Not allowed');
    }

    const content = dto.content.trim();
    if (!content)
      throw new BadRequestException('MEssge content cannot be empty');

    return this.prisma.$transaction(async (tx) => {
      const channel = await tx.channel.findUnique({
        where: { id: channelId },
        select: { id: true, type: true },
      });

      if (!channel) throw new NotFoundException('Channel not found');
      if (channel.type !== 'TEXT') {
        throw new BadRequestException(
          'Messages can only be sent to TEXT channels',
        );
      }

      const message = await tx.message.create({
        data: {
          content,
          channelId,
          userId: actor.userId,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: {
            select: { id: true, username: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'MESSAGE_CREATED',
          meta: {
            messageId: message.id,
            channelId,
          },
        },
      });
      this.realtime.emitMessageCreated(channelId, message);
      return message;
    });
  }
}
