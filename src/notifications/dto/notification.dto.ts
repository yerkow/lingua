export class SubscribeDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
}

export class SendNotificationDto {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  userId?: string;
}
