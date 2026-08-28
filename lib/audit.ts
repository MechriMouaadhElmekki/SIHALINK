import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function logAudit(params: {
  actorId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Json;
  newData?: Json;
  metadata?: Json;
}) {
  const supabase = createClient();
  await supabase.from('audit_logs').insert({
    actor_id: params.actorId ?? null,
    actor_role: params.actorRole ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    old_data: params.oldData ?? null,
    new_data: params.newData ?? null,
    metadata: params.metadata ?? null,
  });
}
