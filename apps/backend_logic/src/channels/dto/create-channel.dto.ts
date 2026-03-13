import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum ChannelTypeDto {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}

export class CreateChannelDto {
  @IsString()
  @MaxLength(64)
  name!: string;

  @IsEnum(ChannelTypeDto)
  type!: ChannelTypeDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
