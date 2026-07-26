import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
}

export enum FriendshipRequestType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export class GetRequestsQueryDto extends GetFriendsQueryDto {
  @IsOptional()
  @IsEnum(FriendshipRequestType)
  type?: FriendshipRequestType;
}
