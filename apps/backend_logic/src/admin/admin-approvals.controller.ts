import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminApprovalsService } from './admin-approvals.service';
import { BulkApprovalsDto } from './dto/bulk-approvals.dto';

@Controller('admin/approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminApprovalsController {
  constructor(private readonly approvals: AdminApprovalsService) {}

  @Get('pending')
  listPending() {
    return this.approvals.listPending();
  }

  @Patch()
  applyBulk(@Req() req: any, @Body() dto: BulkApprovalsDto) {
    const user = req.user as { userId: string; role: string };
    return this.approvals.applyBulk(user.userId, dto);
  }
}
