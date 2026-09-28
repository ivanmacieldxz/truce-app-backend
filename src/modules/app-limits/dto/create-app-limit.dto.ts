import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateAppLimitDto {
  @IsString()
  @IsNotEmpty()
  packageName: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  dailyLimit: number;
}
