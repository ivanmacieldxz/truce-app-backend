import { IsEnum } from 'class-validator';

export enum FriendshipStatusUpdate {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class UpdateFriendshipDto {
  @IsEnum(FriendshipStatusUpdate)
  status: FriendshipStatusUpdate;
}
