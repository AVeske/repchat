import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    return this.prisma.user.findMany({
      where: {
        role: { in: ['USER', 'ADMIN'] },
      },
      orderBy: [{ username: 'asc' }],
      select: {
        id: true,
        username: true,
        role: true,
      },
    });
  }
}
