export class UserAppTimeDto {
  id: string;
  appId: string;
  packageName: string;
  appName: string;
  timeSpent: number;
  date: string;
}

export class SyncResultDto {
  syncedCount: number;
}
