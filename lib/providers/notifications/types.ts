export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SmsMessage {
  to: string;
  body: string;
}

export interface PushMessage {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ success: boolean; messageId?: string }>;
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<{ success: boolean; messageId?: string }>;
}

export interface PushProvider {
  send(message: PushMessage): Promise<{ success: boolean; messageId?: string }>;
}
