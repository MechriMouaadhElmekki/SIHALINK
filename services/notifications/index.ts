import type { EmailProvider, SmsProvider, PushProvider } from './types';
import { MockEmailProvider } from './mock-email';
import { MockSmsProvider } from './mock-sms';

function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'mock';
  switch (provider) {
    // case 'resend': return new ResendEmailProvider();
    default: return new MockEmailProvider();
  }
}

function createSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER || 'mock';
  switch (provider) {
    // case 'twilio': return new TwilioSmsProvider();
    default: return new MockSmsProvider();
  }
}

export const emailProvider = createEmailProvider();
export const smsProvider = createSmsProvider();
export type { EmailProvider, SmsProvider, PushProvider } from './types';
