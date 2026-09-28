import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTimeRequestsDto {
  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'DENIED'])
  status?: string;

  @IsOptional()
  @IsIn(['INCOMING', 'OUTGOING'])
  type?: 'INCOMING' | 'OUTGOING';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
