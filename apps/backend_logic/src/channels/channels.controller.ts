import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('channels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER', 'ADMIN')
export class ChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Get()
  async list() {
    return this.channels.listChannels();
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateChannelDto) {
    return this.channels.createChannel(req.user, dto);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.channels.updateChannel(req.user, id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.channels.deleteChannel(req.user, id);
  }
}
