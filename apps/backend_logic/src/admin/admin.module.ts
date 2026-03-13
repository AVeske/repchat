import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminApprovalsController } from './admin-approvals.controller';
import { AdminApprovalsService } from './admin-approvals.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  controllers: [
    AdminController,
    AdminApprovalsController,
    AdminUsersController,
  ],
  providers: [AdminApprovalsService, AdminUsersService],
})
export class AdminModule {}
