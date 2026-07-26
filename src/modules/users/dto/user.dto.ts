export class UserDto {
  id: string;
  email: string;
  username: string;
  fcmToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserSummaryDto {
  id: string;
  username: string;
}
