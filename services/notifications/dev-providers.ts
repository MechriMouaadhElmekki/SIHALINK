import type { EmailProvider, SmsProvider, PushProvider } from './types';

/** Dev/Demo Email Provider - logs to console, does not send real emails */
export class DevEmailProvider implements EmailProvider {
  async send(to: string, subject: string, html: string): Promise<void> {
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
  }
}

/** Dev/Demo SMS Provider - logs to console, does not send real SMS */
export class DevSmsProvider implements SmsProvider {
  async send(to: string, message: string): Promise<void> {
    console.log(`[DEV SMS] To: ${to} | Message: ${message}`);
  }
}

/** Dev/Demo Push Provider - logs to console */
export class DevPushProvider implements PushProvider {
  async send(userId: string, title: string, body: string): Promise<void> {
    console.log(`[DEV PUSH] UserId: ${userId} | Title: ${title} | Body: ${body}`);
  }
}

export const emailProvider = new DevEmailProvider();
export const smsProvider = new DevSmsProvider();
export const pushProvider = new DevPushProvider();
