'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AlertTriangle, FileText, UserCheck, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const mobileNavItems = [
  { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/reports', label: 'بلاغاتي', icon: FileText },
  { href: '/emergency', label: 'طوارئ', icon: AlertTriangle, emergency: true },
  { href: '/doctors', label: 'أطباء', icon: UserCheck },
  { href: '/notifications', label: 'إشعارات', icon: Bell },
];

export function MobileNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-border z-30 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1">
        {mobileNavItems.map(({ href, label, icon: Icon, emergency }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[56px] transition-colors relative',
                active
                  ? emergency ? 'text-red-600' : 'text-blue-600'
                  : 'text-gray-500 dark:text-gray-400',
                emergency && 'relative'
              )}
            >
              {emergency ? (
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center -mt-5 shadow-lg border-4 border-white dark:border-gray-900 transition-all',
                  active ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {href === '/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -end-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              )}
              {!emergency && <span className="text-[10px] font-medium">{label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
