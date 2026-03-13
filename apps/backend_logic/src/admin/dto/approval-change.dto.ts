import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { UserStatus } from '@prisma/client';

export class ApprovalChangeDto {
  @IsUUID()
  userId: string;

  //Only allow APPROVED or REJECTED in this endpoint
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsOptional()
  @IsString()
  @MinLength(3)
  rejectedReason?: string;
}
