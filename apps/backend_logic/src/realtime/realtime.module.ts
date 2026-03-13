import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { ConfigModule } from '@nestjs/config';
import { PresenceService } from './presence.service';
import { VoiceModule } from 'src/voice/voice.module';

@Module({
  imports: [ConfigModule, VoiceModule],
  providers: [RealtimeGateway, PresenceService],
  exports: [RealtimeGateway, PresenceService],
})
export class RealtimeModule {}
