import { IsString, IsUUID } from 'class-validator';

export class CreateFriendshipDto {
  @IsString()
  @IsUUID()
  targetUserId: string;
}
