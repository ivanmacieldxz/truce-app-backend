export class TimeRequestRecipientDto {
  id: string;
  receiverId: string;
  receiverUsername: string;
  status: string;
  createdAt: Date;
}

export class TimeRequestDto {
  id: string;
  senderId: string;
  senderUsername: string;
  appId: string;
  appName: string;
  packageName: string;
  amountRequested: number;
  message: string | null;
  status: string;
  createdAt: Date;
  recipients: TimeRequestRecipientDto[];
}

export class SenderUsageTodayDto {
  timeSpent: number;
  dailyLimit: number | null;
}

export class TimeRequestDetailDto extends TimeRequestDto {
  senderUsageToday: SenderUsageTodayDto;
}
