import { getSupabaseServiceClient } from './supabase/server';

export async function createAuditLog(params: {
  actorId?: string;
  actorRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    const supabase = getSupabaseServiceClient();
    await supabase.from('audit_logs').insert({
      actor_id: params.actorId ?? null,
      actor_role: params.actorRole ?? null,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? null,
      ip_address: params.ipAddress ?? null,
    });
  } catch (e) {
    // Audit log failure must never break the main flow
    console.error('[AUDIT LOG ERROR]', e);
  }
}
