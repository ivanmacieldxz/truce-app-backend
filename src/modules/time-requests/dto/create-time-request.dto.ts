import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateTimeRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  receiverIds: string[];

  @IsString()
  @IsNotEmpty()
  appId: string;

  @IsInt()
  @Min(1)
  amountRequested: number;

  @IsOptional()
  @IsString()
  message?: string;
}
