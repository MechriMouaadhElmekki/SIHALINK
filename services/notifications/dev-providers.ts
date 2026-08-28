import { EmailProvider, SmsProvider, PushProvider, EmailPayload, SmsPayload, PushPayload } from './types';

export class DevEmailProvider implements EmailProvider {
  async send(payload: EmailPayload) {
    console.log('[DEV EMAIL] Would send email:', { to: payload.to, subject: payload.subject });
    return { success: true, id: `dev-email-${Date.now()}` };
  }
}

export class DevSmsProvider implements SmsProvider {
  async send(payload: SmsPayload) {
    console.log('[DEV SMS] Would send SMS:', { to: payload.to, message: payload.message.slice(0, 50) });
    return { success: true, id: `dev-sms-${Date.now()}` };
  }
}

export class DevPushProvider implements PushProvider {
  async send(payload: PushPayload) {
    console.log('[DEV PUSH] Would send push:', { userId: payload.userId, title: payload.title });
    return { success: true, id: `dev-push-${Date.now()}` };
  }
}

export function getEmailProvider(): EmailProvider {
  return new DevEmailProvider();
}

export function getSmsProvider(): SmsProvider {
  return new DevSmsProvider();
}

export function getPushProvider(): PushProvider {
  return new DevPushProvider();
}
