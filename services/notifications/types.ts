// ============================================================
// SIHALINK - Notification Provider Interfaces
// ============================================================

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
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
  send(payload: EmailPayload): Promise<{ success: boolean; messageId?: string }>;
}

export interface SmsProvider {
  send(payload: SmsPayload): Promise<{ success: boolean; messageId?: string }>;
}

export interface PushProvider {
  send(payload: PushPayload): Promise<{ success: boolean; messageId?: string }>;
}
