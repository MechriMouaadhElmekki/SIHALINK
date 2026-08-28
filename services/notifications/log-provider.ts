import type { EmailProvider, SmsProvider, PushProvider, EmailPayload, SmsPayload, PushPayload } from './interface';

// Development providers — log to console instead of sending real messages

export class LogEmailProvider implements EmailProvider {
  async send(payload: EmailPayload) {
    console.log('[EMAIL LOG]', { to: payload.to, subject: payload.subject });
    return { success: true, messageId: `log-email-${Date.now()}` };
  }
}

export class LogSmsProvider implements SmsProvider {
  async send(payload: SmsPayload) {
    console.log('[SMS LOG]', { to: payload.to, body: payload.body.substring(0, 50) });
    return { success: true, messageId: `log-sms-${Date.now()}` };
  }
}

export class LogPushProvider implements PushProvider {
  async send(payload: PushPayload) {
    console.log('[PUSH LOG]', { userId: payload.userId, title: payload.title });
    return { success: true, messageId: `log-push-${Date.now()}` };
  }
}

export const emailProvider = new LogEmailProvider();
export const smsProvider = new LogSmsProvider();
export const pushProvider = new LogPushProvider();
