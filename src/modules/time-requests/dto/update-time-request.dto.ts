import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateTimeRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['APPROVED', 'DENIED'], {
    message: 'status must be either APPROVED or DENIED',
  })
  status: 'APPROVED' | 'DENIED';
}
