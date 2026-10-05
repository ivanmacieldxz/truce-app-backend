import { IsIn, IsString } from 'class-validator';

export class UpdateLimitRequestDto {
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';
}
