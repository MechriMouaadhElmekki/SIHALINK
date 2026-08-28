export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SmsPayload {
  to: string;
  message: string;
}

export interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<{ success: boolean; id?: string }>;
}

export interface SmsProvider {
  send(payload: SmsPayload): Promise<{ success: boolean; id?: string }>;
}

export interface PushProvider {
  send(payload: PushPayload): Promise<{ success: boolean; id?: string }>;
}
