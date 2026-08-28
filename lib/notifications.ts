import { createClient } from '@/lib/supabase/server';
import type { NotificationType } from '@/types/database';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  titleAr: string;
  titleFr: string;
  titleEn: string;
  bodyAr: string;
  bodyFr: string;
  bodyEn: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const supabase = createClient();
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title_ar: params.titleAr,
    title_fr: params.titleFr,
    title_en: params.titleEn,
    body_ar: params.bodyAr,
    body_fr: params.bodyFr,
    body_en: params.bodyEn,
    related_entity_type: params.relatedEntityType ?? null,
    related_entity_id: params.relatedEntityId ?? null,
  });
  if (error) console.error('[Notification Error]', error);
}
