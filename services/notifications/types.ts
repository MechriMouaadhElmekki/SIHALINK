export interface NotificationPayload {
  userId: string;
  titleAr: string;
  titleFr?: string;
  titleEn?: string;
  bodyAr: string;
  bodyFr?: string;
  bodyEn?: string;
  entityType?: string;
  entityId?: string;
  notificationType: string;
}

export interface EmailProvider {
  send(to: string, subject: string, html: string): Promise<void>;
}

export interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}

export interface PushProvider {
  send(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
}
