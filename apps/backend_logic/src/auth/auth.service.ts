import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { UserRole, UserStatus } from '@prisma/client';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: dto.username }],
      },
    });

    if (existing) {
      throw new BadRequestException('Email or username already in use.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        username: dto.username,
        passwordHash,
        status: UserStatus.PENDING,
        role: UserRole.USER,
      },
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      status: user.status,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status == UserStatus.REJECTED) {
      throw new ForbiddenException('Your application has been rejected!');
    }

    if (user.status == UserStatus.DISABLED) {
      throw new ForbiddenException('Your account has been disabled');
    }

    if (user.status !== UserStatus.APPROVED) {
      throw new ForbiddenException('Your account has not been approved');
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
}
