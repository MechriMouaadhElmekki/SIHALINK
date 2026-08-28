import type { SmsProvider, SmsPayload } from './types';

export class MockSmsProvider implements SmsProvider {
  async send(payload: SmsPayload) {
    console.log('[MOCK SMS] Would send to:', payload.to, '| Body:', payload.body);
    return { success: true, messageId: `mock-sms-${Date.now()}` };
  }
}
