export class FriendAppUsageDto {
  name: string;
  packageName: string;
  minutesSpent: number;
}

export class FriendAppLimitDto {
  name: string;
  packageName: string;
  limitMinutes: number;
  isEnabled: boolean;
}

export class FriendActivityDto {
  spentMinutes: number;
  targetLimitMinutes: number;
  topApps: FriendAppUsageDto[];
  appLimits: FriendAppLimitDto[];
}

export class FriendDto {
  id: string; // Friendship ID
  friendId: string; // The ID of the friend user
  username: string; // The username of the friend
  createdAt: Date;
  activity: FriendActivityDto;
}

export class FriendshipRequestDto {
  id: string; // Friendship ID
  userId: string; // The ID of the other user
  username: string; // The username of the other user
  type: 'INCOMING' | 'OUTGOING';
  createdAt: Date;
}
