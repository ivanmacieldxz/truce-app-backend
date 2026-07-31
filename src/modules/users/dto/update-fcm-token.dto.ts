import { IsOptional, IsString } from 'class-validator';

export class UpdateFcmTokenDto {
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
