import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createReportSchema = z.object({
  emergency_type: z.string().min(1),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  description: z.string().optional(),
  triage_answers: z.record(z.unknown()).optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    wilaya: z.string().optional(),
  }).optional(),
});

function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

    const { emergency_type, priority, description, triage_answers, location } = parsed.data;

    // Generate unique report number: SH-YYYY-XXXXXX
    const year = new Date().getFullYear();
    const { data: countData } = await supabase
      .from('emergency_reports')
      .select('id', { count: 'exact' })
      .like('report_number', `SH-${year}-%`);
    const sequence = ((countData?.length || 0) + 1).toString().padStart(6, '0');
    const report_number = `SH-${year}-${sequence}`;

    // Create report
    const { data: report, error: reportError } = await supabase
      .from('emergency_reports')
      .insert({
        user_id: user.id,
        report_number,
        emergency_type,
        priority,
        description,
        status: 'SUBMITTED',
        triage_data: triage_answers || {},
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report creation error:', reportError);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    // Create location if provided
    if (location && report) {
      await supabase.from('emergency_locations').insert({
        report_id: report.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address,
        city: location.city,
        wilaya: location.wilaya,
        captured_at: new Date().toISOString(),
      });
    }

    // Create initial event
    if (report) {
      await supabase.from('emergency_report_events').insert({
        report_id: report.id,
        event_type: 'REPORT_SUBMITTED',
        actor_id: user.id,
        description: 'تم تقديم البلاغ',
      });
    }

    // Create in-app notification
    if (report) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'EMERGENCY_UPDATE',
        title: 'تم استلام بلاغك',
        body: `رقم البلاغ: ${report_number}`,
        data: { report_id: report.id },
      });
    }

    // Audit log
    if (report) {
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'EMERGENCY_REPORT_CREATED',
        entity: 'emergency_reports',
        entity_id: report.id,
        metadata: { report_number, emergency_type, priority },
      });
    }

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('emergency_reports')
      .select('*, emergency_locations(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data: reports, count, error } = await query;
    if (error) return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });

    return NextResponse.json({ reports, total: count, page, limit });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
