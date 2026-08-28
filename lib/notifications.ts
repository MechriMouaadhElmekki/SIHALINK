import { createAdminClient } from '@/lib/supabase/admin';

interface NotificationPayload {
  user_id: string;
  type: 'EMERGENCY_UPDATE' | 'APPOINTMENT_UPDATE' | 'SECURITY_ALERT' | 'SYSTEM_ANNOUNCEMENT' | 'ACCOUNT_NOTIFICATION';
  title_ar: string;
  title_fr: string;
  title_en: string;
  body_ar: string;
  body_fr: string;
  body_en: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

export async function createNotification(payload: NotificationPayload): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('notifications').insert(payload);
  } catch (err) {
    console.error('[Notifications] Failed to create notification:', err);
  }
}
