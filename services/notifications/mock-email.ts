import type { EmailProvider, EmailPayload } from './types';

export class MockEmailProvider implements EmailProvider {
  async send(payload: EmailPayload) {
    console.log('[MOCK EMAIL] Would send to:', payload.to, '| Subject:', payload.subject);
    return { success: true, messageId: `mock-email-${Date.now()}` };
  }
}
