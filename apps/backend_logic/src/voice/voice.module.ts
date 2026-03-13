import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { VoiceService } from './voice.service';

@Module({
  providers: [VoiceService, PrismaService],
  exports: [VoiceService],
})
export class VoiceModule {}
