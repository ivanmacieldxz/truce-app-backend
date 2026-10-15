import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetFriendsQueryDto {
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

  @IsOptional()
  @IsDateString()
  date?: string;
}

export enum FriendshipRequestType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export class GetRequestsQueryDto extends GetFriendsQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsEnum(FriendshipRequestType)
  type?: FriendshipRequestType;
}
