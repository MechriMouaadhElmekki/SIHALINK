import type { UserRole } from '@/types/database';

export interface AuditEntry {
  actor_id?: string;
  actor_role?: UserRole;
  action: string;
  entity: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(entry: AuditEntry) {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();
    await supabase.from('audit_logs').insert({
      actor_id: entry.actor_id,
      actor_role: entry.actor_role,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id,
      metadata: entry.metadata,
    });
  } catch (err) {
    // Audit log failure should never break application flow
    console.error('[AUDIT] Failed to create audit log:', err);
  }
}
