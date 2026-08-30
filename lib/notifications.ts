import { createAdminClient } from '@/lib/supabase/admin';

// Notification type values must match the CHECK constraint in the canonical schema:
// CHECK (type IN ('emergency_update','appointment_update','security_alert',
//                 'system_announcement','account_notification'))
type NotificationType =
  | 'emergency_update'
  | 'appointment_update'
  | 'security_alert'
  | 'system_announcement'
  | 'account_notification';

interface NotificationPayload {
  user_id: string;
  type: NotificationType;
  title_ar: string;
  title_fr?: string;
  title_en?: string;
  body_ar: string;
  body_fr?: string;
  body_en?: string;
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
