import { createAdminClient } from '@/lib/supabase/admin';
import { UserRole } from '@/types';

// Columns on audit_logs (canonical schema):
// id, actor_id, actor_role, action, entity_type, entity_id,
// old_values, new_values, metadata, ip_address, user_agent, created_at
// NOTE: actor_email does NOT exist on this table.
interface AuditOptions {
  actor_id?: string | null;
  actor_role?: UserRole | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
}

export async function writeAuditLog(opts: AuditOptions): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('audit_logs').insert({
      actor_id: opts.actor_id ?? null,
      actor_role: opts.actor_role ?? null,
      action: opts.action,
      entity_type: opts.entity_type,
      entity_id: opts.entity_id ?? null,
      metadata: opts.metadata ?? null,
      ip_address: opts.ip_address ?? null,
    });
  } catch (err) {
    // Audit log failure should not break application flow
    console.error('[AuditLog] Failed to write audit log:', err);
  }
}
