import { getSupabaseServiceClient } from './supabase/server';

export async function generateReportNumber(): Promise<string> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.rpc('generate_report_number');
  if (error || !data) {
    // Fallback: timestamp-based (should not happen in production)
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 900000) + 100000;
    return `SH-${year}-${rand}`;
  }
  return data as string;
}
