import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listAllNonPending(search?: string) {
    const where: Prisma.UserWhereInput = {
      status: { not: UserStatus.PENDING },
    };

    if (search && search.trim().length > 0) {
      where.OR = [
        { username: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        rejectedReason: true,
        rejectedAt: true,
        approvedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateRole(actorUserId: string, userId: string, dto: UpdateRoleDto) {
    if (actorUserId === userId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        action: 'USER_ROLE_CHANGE',
        meta: {
          userId,
          from: existing.role,
          to: dto.role,
        },
      },
    });

    return updated;
  }

  async updateStatus(
    actorUserId: string,
    userId: string,
    dto: UpdateStatusDto,
  ) {
    if (dto.status === UserStatus.PENDING) {
      throw new BadRequestException('Cannot set status to PENDING');
    }

    if (dto.status === UserStatus.REJECTED) {
      throw new BadRequestException('Cannot reject users from All Users tab');
    }

    //Only allow APPROVED or DISABLED
    if (
      dto.status !== UserStatus.APPROVED &&
      dto.status !== UserStatus.DISABLED
    ) {
      throw new BadRequestException(
        'Only APPROVED or DISABLED is allowed here',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    //Optional safety, so i dont disable my super_user
    if (actorUserId === userId && dto.status === UserStatus.DISABLED) {
      throw new BadRequestException('You cannot disable your own account');
    }

    const now = new Date();

    const data =
      dto.status === UserStatus.APPROVED
        ? {
            status: UserStatus.APPROVED,
            approvedAt: now,
            rejectedAt: null,
            rejectedReason: null,
          }
        : {
            status: UserStatus.DISABLED,
          };

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        role: true,
        approvedAt: true,
        rejectedAt: true,
        rejectedReason: true,
        updatedAt: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        action: 'USER_STATUS_CHANGE',
        meta: {
          userId,
          from: existing.status,
          to: dto.status,
          source: 'admin_users:tab',
        },
      },
    });
    return updated;
  }

  async deleteUser(actorUserId: string, userId: string) {
    if (actorUserId === userId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        role: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('User nto found');
    }

    const now = new Date();

    //Make unique replacement values
    const suffix = `${userId.replace(/-/g, '').slice(0, 12)}_${now.getTime()}`;
    const newEmail = `deleted_${suffix}@repchat.local`;
    const newUsername = `deleted_${suffix}`;

    //Prevent login by setting a random hash
    const passwordHash = await bcrypt.hash(`deleted_${suffix}`, 12);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.DISABLED,
        email: newEmail,
        username: newUsername,
        passwordHash,

        //Cleanup other fields
        rejectedAt: null,
        rejectedReason: null,
        approvedAt: null,
        lastLoginAt: null,
      },
      select: {
        id: true,
        status: true,
        email: true,
        username: true,
        updatedAt: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        action: 'USER_ANONYMIZE',
        meta: {
          userId,
          oldEmail: existing.email,
          oldUsername: existing.username,
          oldStatus: existing.status,
          oldRole: existing.role,
          newEmail,
          newUsername,
        },
      },
    });

    return { ok: true, user: updated };
  }
}
