export class LimitRequestRecipientDto {
  id: string;
  receiverId: string;
  receiverUsername: string;
  status: string;
  createdAt: Date;
}

export class LimitRequestDto {
  id: string;
  senderId: string;
  senderUsername: string;
  appId: string;
  appName: string;
  packageName: string;
  type: string; // MODIFY, DISABLE, DELETE
  currentLimit: number;
  proposedLimit: number | null;
  reason: string | null;
  status: string;
  createdAt: Date;
  recipients: LimitRequestRecipientDto[];
}

export class LimitSenderUsageTodayDto {
  timeSpent: number;
  dailyLimit: number | null;
  isEnabled: boolean;
}

export class LimitRequestDetailDto extends LimitRequestDto {
  senderUsageToday: LimitSenderUsageTodayDto;
}
