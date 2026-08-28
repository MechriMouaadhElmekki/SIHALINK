import { MockEmailProvider, MockSmsProvider, MockPushProvider } from './mock-providers';

export const emailProvider = new MockEmailProvider();
export const smsProvider = new MockSmsProvider();
export const pushProvider = new MockPushProvider();
export type { EmailProvider, SmsProvider, PushProvider } from './types';
