import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const start = Date.now();
  const { error } = await supabase.from('profiles').select('id').limit(1);
  const latency = Date.now() - start;
  return NextResponse.json({
    status: error ? 'degraded' : 'ok',
    db_latency_ms: latency,
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
}
