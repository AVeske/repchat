import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { ApprovalChangeDto } from './approval-change.dto';

export class BulkApprovalsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ApprovalChangeDto)
  changes: ApprovalChangeDto[];
}
