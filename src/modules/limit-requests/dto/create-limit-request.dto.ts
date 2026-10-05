import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateLimitRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  receiverIds: string[];

  @IsString()
  @IsNotEmpty()
  appId: string;

  @IsString()
  @IsIn(['MODIFY', 'DISABLE', 'DELETE'])
  type: 'MODIFY' | 'DISABLE' | 'DELETE';

  @IsOptional()
  @IsInt()
  @Min(1)
  proposedLimit?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
