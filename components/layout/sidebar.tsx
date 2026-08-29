'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Heart, AlertTriangle, FileText, UserCheck, Calendar,
  Building2, Pill, FlaskConical, BookOpen, Bell, User,
  Settings, LayoutDashboard, LogOut, ShieldCheck, Headphones,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/emergency', label: 'طوارئ', icon: AlertTriangle, emergency: true },
  { href: '/reports', label: 'بلاغاتي', icon: FileText },
  { href: '/doctors', label: 'الأطباء', icon: UserCheck },
  { href: '/appointments', label: 'المواعيد', icon: Calendar },
  { href: '/facilities', label: 'المرافق', icon: Building2 },
  { href: '/pharmacies', label: 'الصيدليات', icon: Pill },
  { href: '/laboratories', label: 'المخابر', icon: FlaskConical },
  { href: '/first-aid', label: 'الإسعافات الأولية', icon: BookOpen },
];

const bottomItems = [
  { href: '/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/profile', label: 'ملفي', icon: User },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

interface SidebarProps {
  userRole?: string[];
  unreadCount?: number;
}

export function Sidebar({ userRole = [], unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = userRole.includes('ADMIN') || userRole.includes('SUPER_ADMIN');
  const isOperator = userRole.includes('EMERGENCY_OPERATOR');

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const NavLink = ({ href, label, icon: Icon, emergency, badge }: {
    href: string; label: string; icon: React.ElementType;
    emergency?: boolean; badge?: number;
  }) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
          active
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
          emergency && 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400',
          emergency && active && 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        )}
      >
        <Icon className={cn('w-5 h-5 shrink-0', emergency && 'text-red-500')} />
        <span className="flex-1 truncate">{label}</span>
        {badge !== undefined && badge > 0 && (
          <Badge variant="destructive" className="h-5 min-w-[20px] text-xs px-1">{badge > 99 ? '99+' : badge}</Badge>
        )}
      </Link>
    );
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white dark:bg-gray-900 border-e border-border fixed top-0 start-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-base leading-tight">SIHALINK</p>
          <p className="text-xs text-muted-foreground">صحة لينك</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map(item => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* Role-based links */}
        {isOperator && (
          <>
            <div className="my-2 border-t border-border" />
            <NavLink href="/operator" label="لوحة المشغل" icon={Headphones} />
          </>
        )}
        {isAdmin && (
          <>
            <div className="my-2 border-t border-border" />
            <NavLink href="/admin" label="لوحة الإدارة" icon={ShieldCheck} />
          </>
        )}
      </nav>

      {/* Bottom nav */}
      <div className="p-3 border-t border-border space-y-1">
        {bottomItems.map(item => (
          <NavLink
            key={item.href}
            {...item}
            badge={item.href === '/notifications' ? unreadCount : undefined}
          />
        ))}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
