import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bell, CheckCheck, AlertTriangle, Calendar, FileText, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { formatRelative } from '@/lib/utils';

const TYPE_ICON: Record<string, React.ReactNode> = {
  REPORT_SUBMITTED:      <FileText className="w-4 h-4 text-blue-600" />,
  REPORT_STATUS_CHANGED: <FileText className="w-4 h-4 text-orange-600" />,
  APPOINTMENT_REQUESTED: <Calendar className="w-4 h-4 text-green-600" />,
  APPOINTMENT_CONFIRMED: <Calendar className="w-4 h-4 text-green-600" />,
  APPOINTMENT_CANCELLED: <Calendar className="w-4 h-4 text-red-600" />,
  EMERGENCY_ALERT:       <AlertTriangle className="w-4 h-4 text-red-600" />,
  SYSTEM:                <Info className="w-4 h-4 text-gray-500" />,
};

export default async function NotificationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title_ar, message_ar, is_read, created_at, related_report_id, related_appointment_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(60);

  const unread = notifications?.filter(n => !n.is_read).length ?? 0;

  // Mark all as read (fire-and-forget)
  if (unread > 0) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  }

  return (
    <div dir="rtl">
      <Header title="الإشعارات" subtitle={unread > 0 ? `${unread} غير مقروء` : 'جميعها مقروءة'} unreadCount={0} />
    <div className="p-4 lg:p-6">
      {notifications && notifications.length > 0 ? (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const href = n.related_report_id
              ? `/reports/${n.related_report_id}`
              : n.related_appointment_id
              ? `/appointments/${n.related_appointment_id}`
              : null;
            const icon = TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-gray-500" />;
            const item = (
              <Card key={n.id} className={n.is_read ? 'opacity-70' : 'border-blue-200 dark:border-blue-800 shadow-sm'}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      n.is_read ? 'bg-muted' : 'bg-blue-50 dark:bg-blue-900/20'
                    }`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {n.title_ar}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message_ar}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{formatRelative(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            return href ? <Link key={n.id} href={href}>{item}</Link> : <li key={n.id}>{item}</li>;
          })}
        </ul>
      ) : (
        <div className="text-center py-20 space-y-3">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">لا يوجد إشعارات</p>
        </div>
      )}
    </div>
    </div>
  );
}
