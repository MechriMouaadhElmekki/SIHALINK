/**
 * Development/Demo notification providers.
 * These log to console and do NOT send real emails, SMS, or push notifications.
 * Replace with real providers (Resend, Twilio, OneSignal) via environment variables.
 */
import type { EmailProvider, SmsProvider, PushProvider } from './types';

export class DevEmailProvider implements EmailProvider {
  async send(message: { to: string; subject: string; html: string }) {
    console.log('[DEV EMAIL - NOT SENT]', { to: message.to, subject: message.subject });
    return { success: true, messageId: `dev-email-${Date.now()}` };
  }
}

export class DevSmsProvider implements SmsProvider {
  async send(message: { to: string; body: string }) {
    console.log('[DEV SMS - NOT SENT]', { to: message.to, body: message.body.substring(0, 50) });
    return { success: true, messageId: `dev-sms-${Date.now()}` };
  }
}

export class DevPushProvider implements PushProvider {
  async send(message: { userId: string; title: string; body: string }) {
    console.log('[DEV PUSH - NOT SENT]', { userId: message.userId, title: message.title });
    return { success: true, messageId: `dev-push-${Date.now()}` };
  }
}

export const emailProvider: EmailProvider = new DevEmailProvider();
export const smsProvider: SmsProvider = new DevSmsProvider();
export const pushProvider: PushProvider = new DevPushProvider();
