import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { PresenceService } from './presence.service';
import { VoiceModule } from 'src/voice/voice.module';
import { VoiceService } from 'src/voice/voice.service';
import { channel } from 'diagnostics_channel';
import { from } from 'rxjs';

type WsUser = {
  userId: string;
  role: string;
};

type WebRtcOfferPayload = {
  toUserId: string;
  channelId: string;
  offer: any;
};

type WebRtcAnswerPayload = {
  toUserId: string;
  channelId: string;
  answer: any;
};

type WebRtcIcePayload = {
  toUserId: string;
  channelId: string;
  candidate: any;
};

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly config: ConfigService,
    private readonly presence: PresenceService,
    private readonly voice: VoiceService,
  ) {}

  /**
   * When a socket connects, we authenticate it using the JWT token.
   * We store the user info in socket.data so later handlers can use it.
   */

  private async broadcastVoiceState(channelId: string) {
    const members = await this.voice.listVoiceMembers(channelId);
    this.server.emit('voice:state', { channelId, members });
  }

  @SubscribeMessage('voice:sync')
  async onVoiceSync(@ConnectedSocket() client: Socket) {
    const user = client.data.user as
      | { userId: string; role: string }
      | undefined;
    if (!user) throw new ForbiddenException('Unauthorized');

    if (user.role !== 'USER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Not allowed');
    }

    const states = await this.voice.listAllVoiceStates();
    return { states };
  }

  @SubscribeMessage('voice:join')
  async onVoiceJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    const user = client.data.user as
      | { userId: string; role: string }
      | undefined;
    if (!user) throw new ForbiddenException('Unauthorized');

    const channelId = body?.channelId;
    if (!channelId || typeof channelId !== 'string') {
      throw new BadRequestException('ChannelId is required');
    }
    //Join/move in DB
    const result = await this.voice.joinVoice(user, channelId);
    //Broadcast new channel members
    await this.broadcastVoiceState(channelId);
    //If we left an old channel, broadcast old channel members too
    if (result.leftChannelId) {
      await this.broadcastVoiceState(result.leftChannelId);
    }
    return { activeVoiceChannelId: result.activeVoiceChannelId };
  }

  @SubscribeMessage('voice:leave')
  async onVoiceLeave(@ConnectedSocket() client: Socket) {
    const user = client.data.user as
      | { userId: string; role: string }
      | undefined;
    if (!user) throw new ForbiddenException('Unauthorized');

    const result = await this.voice.leaveVoice(user);
    //Broadcast updated state for any channel they left
    for (const channelId of result.leftChannelIds) {
      await this.broadcastVoiceState(channelId);
    }
    return { ok: true };
  }

  handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const user = this.verifyToken(token);

      // Only normal app roles should connect
      if (user.role !== 'USER' && user.role !== 'ADMIN') {
        throw new ForbiddenException('Not allowed');
      }

      client.data.user = user;

      // Join a personal room (useful later for private notifications)
      client.join(`user:${user.userId}`);

      const becameOnline = this.presence.markConnected(user.userId);
      if (becameOnline) {
        this.server.emit('presence:online', { userId: user.userId });
      }

      this.logger.log(`Socket connected: ${user.userId} (${user.role})`);
    } catch (e: any) {
      this.logger.warn(
        `Socket connection rejected: ${e?.message ?? 'unknown'}`,
      );
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user as WsUser | undefined;
    if (!user) return;

    // Presence offline handling (already done)
    const becameOffline = this.presence.markDisconnected(user.userId);
    if (becameOffline) {
      this.server.emit('presence:offline', { userId: user.userId });
    }

    // Voice cleanup: only when they became offline (last tab closed)
    // This prevents removing voice session when user still has another tab open.
    if (becameOffline) {
      const result = await this.voice.leaveVoice({
        userId: user.userId,
        role: user.role,
      });
      for (const channelId of result.leftChannelIds) {
        await this.broadcastVoiceState(channelId);
      }
    }

    this.logger.log(`Socket disconnected: ${user.userId}`);
  }

  /**
   * Client tells server: "I am viewing this channel"
   * We join them to room channel:<id>
   */
  @SubscribeMessage('channel:join')
  onJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    const user = client.data.user as WsUser | undefined;
    if (!user) throw new ForbiddenException('Unauthorized');

    const channelId = body?.channelId;
    if (!channelId || typeof channelId !== 'string') return;

    client.join(`channel:${channelId}`);
    return { ok: true };
  }

  /**
   * Client tells server: "I left this channel"
   */
  @SubscribeMessage('channel:leave')
  onLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    const user = client.data.user as WsUser | undefined;
    if (!user) throw new ForbiddenException('Unauthorized');

    const channelId = body?.channelId;
    if (!channelId || typeof channelId !== 'string') return;

    client.leave(`channel:${channelId}`);
    return { ok: true };
  }

  @SubscribeMessage('presence:syn')
  onPresenceSyn(@ConnectedSocket() client: Socket) {
    const user = client.data.user as WsUser | undefined;
    if (!user) throw new ForbiddenException('Unauthorized');

    return { onlineUserIds: this.presence.getOnlineUserIds() };
  }

  /**
   * Called by MessagesService after message is created in database.
   * Emits to everyone currently in that channel room.
   */
  emitMessageCreated(channelId: string, message: any) {
    this.server.to(`channel:${channelId}`).emit('message:created', {
      channelId,
      message,
    });
  }

  @SubscribeMessage('webrtc:offer')
  async onWebRtcOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WebRtcOfferPayload,
  ) {
    const from = client.data.user as
      | { userId: string; role: string }
      | undefined;
    if (!from) throw new ForbiddenException('Unauthorized');

    if (from.role !== 'USER' && from.role !== 'ADMIN') {
      throw new ForbiddenException('Not allowed');
    }

    if (!body?.toUserId || !body?.channelId || !body?.offer) {
      throw new BadRequestException('Invalid webrtc: offer payload');
    }

    await this.assertSameVoiceChannelOrThrow(
      from.userId,
      body.toUserId,
      body.channelId,
    );

    this.server.to(`user:${body.toUserId}`).emit('webrtc:offer', {
      fromUserId: from.userId,
      channelId: body.channelId,
      offer: body.offer,
    });

    return { ok: true };
  }

  @SubscribeMessage('webrtc:answer')
  async onWebRtcAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WebRtcAnswerPayload,
  ) {
    const from = client.data.user as
      | { userId: string; role: string }
      | undefined;
    if (!from) throw new ForbiddenException('Unauthorized');

    if (from.role !== 'USER' && from.role !== 'ADMIN') {
      throw new ForbiddenException('Not allowed');
    }

    if (!body?.toUserId || !body?.channelId || !body?.answer) {
      throw new BadRequestException('Invalid webrtc:answer payload');
    }

    await this.assertSameVoiceChannelOrThrow(
      from.userId,
      body.toUserId,
      body.channelId,
    );

    this.server.to(`user:${body.toUserId}`).emit('webrtc:answer', {
      fromUserId: from.userId,
      channelId: body.channelId,
      answer: body.answer,
    });

    return { ok: true };
  }

  @SubscribeMessage('webrtc:ice')
  async onWebRtcIce(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WebRtcIcePayload,
  ) {
    const from = client.data.user as
      | { userId: string; role: string }
      | undefined;
    if (!from) throw new ForbiddenException('Unauthorized');

    if (from.role !== 'USER' && from.role !== 'ADMIN') {
      throw new ForbiddenException('Not allowed');
    }

    if (!body?.toUserId || !body?.channelId || !body?.candidate) {
      throw new BadRequestException('Invalid webrtc:ice payload');
    }

    await this.assertSameVoiceChannelOrThrow(
      from.userId,
      body.toUserId,
      body.channelId,
    );

    this.server.to(`user:${body.toUserId}`).emit('webrtc:ice', {
      fromUserId: from.userId,
      channelId: body.channelId,
      candidate: body.candidate,
    });

    return { ok: true };
  }

  // ---- Helpers ----

  private extractToken(client: Socket): string {
    // Option 1: Authorization header
    const authHeader = client.handshake.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length);
    }

    // Option 2: query param ?token=...
    const token = client.handshake.query?.token;
    if (typeof token === 'string' && token.length > 0) {
      return token;
    }

    throw new Error('Missing token');
  }

  private verifyToken(token: string): WsUser {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET missing');

    const payload = jwt.verify(token, secret) as any;
    return {
      userId: payload.sub,
      role: payload.role,
    };
  }

  private async assertSameVoiceChannelOrThrow(
    fromUserId: string,
    toUserId: string,
    channelId: string,
  ) {
    const fromChannelId = await this.voice.getActiveVoiceCHannelId(fromUserId);
    const toChannelId = await this.voice.getActiveVoiceCHannelId(toUserId);

    if (!fromChannelId || !toChannelId) {
      throw new ForbiddenException('Both users must be in a voice channel');
    }

    if (fromChannelId !== channelId || toChannelId !== channelId) {
      throw new ForbiddenException('Users are nto i nthe same voice channel!');
    }
  }
}
