import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER', 'ADMIN')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('channels/:id/messages')
  async list(@Param('id') channelId: string, @Query('take') take?: string) {
    const parsedTake = take ? Number(take) : 50;
    return this.messages.listByChannel(
      channelId,
      Number.isFinite(parsedTake) ? parsedTake : 50,
    );
  }

  @Post('channels/:id/messages')
  async create(
    @Req() req: any,
    @Param('id') channelId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messages.createMessage(req.user, channelId, dto);
  }
}
