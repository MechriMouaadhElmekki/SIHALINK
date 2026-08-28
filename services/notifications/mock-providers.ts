// ============================================================
// SIHALINK - Mock Notification Providers
// Log to console only - no real messages sent
// ============================================================

import type { EmailProvider, SmsProvider, PushProvider, EmailPayload, SmsPayload, PushPayload } from './types';

export class MockEmailProvider implements EmailProvider {
  async send(payload: EmailPayload) {
    console.log('[MOCK EMAIL]', payload.to, payload.subject);
    return { success: true, messageId: `mock-email-${Date.now()}` };
  }
}

export class MockSmsProvider implements SmsProvider {
  async send(payload: SmsPayload) {
    console.log('[MOCK SMS]', payload.to, payload.message.slice(0, 50));
    return { success: true, messageId: `mock-sms-${Date.now()}` };
  }
}

export class MockPushProvider implements PushProvider {
  async send(payload: PushPayload) {
    console.log('[MOCK PUSH]', payload.userId, payload.title);
    return { success: true, messageId: `mock-push-${Date.now()}` };
  }
}
