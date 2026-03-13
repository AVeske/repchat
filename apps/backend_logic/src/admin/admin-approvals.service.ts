import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulkApprovalsDto } from './dto/bulk-approvals.dto';
import { Prisma, UserStatus } from '@prisma/client';

@Injectable()
export class AdminApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPending() {
    return this.prisma.user.findMany({
      where: { status: UserStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async applyBulk(actorUserId: string, dto: BulkApprovalsDto) {
    const now = new Date();

    //Basic input validation beyond DTO decorators
    for (const c of dto.changes) {
      if (
        c.status !== UserStatus.APPROVED &&
        c.status !== UserStatus.REJECTED
      ) {
        throw new BadRequestException(
          'Only APPROVED or REJECTED is allowed here',
        );
      }
      if (c.status === UserStatus.REJECTED && !c.rejectedReason?.trim()) {
        throw new BadRequestException(
          'rejectedReason is required when rejecting',
        );
      }
    }

    const results: Array<{
      userId: string;
      ok: boolean;
      status?: UserStatus;
      error?: string;
    }> = [];

    const updatedCount = await this.prisma.$transaction(async (tx) => {
      let updated = 0;

      for (const c of dto.changes) {
        const data =
          c.status === UserStatus.APPROVED
            ? {
                status: UserStatus.APPROVED,
                approvedAt: now,
                rejectedAt: null,
                rejectedReason: null,
              }
            : {
                status: UserStatus.REJECTED,
                rejectedAt: now,
                rejectedReason: c.rejectedReason!.trim(),
                approvedAt: null,
              };

        //Only update if the user is currently PENDING
        const r = await tx.user.updateMany({
          where: { id: c.userId, status: UserStatus.PENDING },
          data,
        });

        if (r.count === 0) {
          results.push({
            userId: c.userId,
            ok: false,
            error: 'User not found or not pending',
          });
          continue;
        }

        updated += 1;
        results.push({ userId: c.userId, ok: true, status: c.status });

        //Audit log (one entry per change)
        await tx.auditLog.create({
          data: {
            actorUserId,
            action: 'USER_STATUS_CHANGE',
            meta: {
              userId: c.userId,
              newStatus: c.status,
              rejectedReason:
                c.status === UserStatus.REJECTED ? c.rejectedReason : null,
            },
          },
        });
      }
      return updated;
    });
    return {
      updated: updatedCount,
      results,
    };
  }
}
