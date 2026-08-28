"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, AlertTriangle, FileText, UserCog, Calendar,
  Building2, Pill, FlaskConical, Heart, Bell, Settings, Shield,
  Users, BarChart3, ClipboardList, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface SidebarProps {
  role: string;
  locale: string;
  labels: Record<string, string>;
  onSignOut: () => void;
}

const userNavItems: SidebarItem[] = [
  { href: '/dashboard', label: 'home', icon: LayoutDashboard },
  { href: '/dashboard/emergency/new', label: 'emergency', icon: AlertTriangle },
  { href: '/dashboard/reports', label: 'myReports', icon: FileText },
  { href: '/dashboard/doctors', label: 'doctors', icon: UserCog },
  { href: '/dashboard/appointments', label: 'appointments', icon: Calendar },
  { href: '/dashboard/facilities', label: 'facilities', icon: Building2 },
  { href: '/dashboard/pharmacies', label: 'pharmacies', icon: Pill },
  { href: '/dashboard/laboratories', label: 'laboratories', icon: FlaskConical },
  { href: '/dashboard/first-aid', label: 'firstAid', icon: Heart },
  { href: '/dashboard/notifications', label: 'notifications', icon: Bell },
];

const adminNavItems: SidebarItem[] = [
  { href: '/admin', label: 'overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'users', icon: Users },
  { href: '/admin/reports', label: 'reports', icon: FileText },
  { href: '/admin/doctors', label: 'doctors', icon: UserCog },
  { href: '/admin/facilities', label: 'facilities', icon: Building2 },
  { href: '/admin/appointments', label: 'appointments', icon: Calendar },
  { href: '/admin/first-aid', label: 'firstAid', icon: Heart },
  { href: '/admin/false-reports', label: 'falseReports', icon: Shield },
  { href: '/admin/analytics', label: 'analytics', icon: BarChart3 },
  { href: '/admin/audit-logs', label: 'auditLogs', icon: ClipboardList },
  { href: '/admin/settings', label: 'settings', icon: Settings },
];

const operatorNavItems: SidebarItem[] = [
  { href: '/operator', label: 'overview', icon: LayoutDashboard },
  { href: '/operator/reports', label: 'reports', icon: FileText },
  { href: '/operator/assigned', label: 'assigned', icon: ClipboardList },
];

export function Sidebar({ role, locale, labels, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const isRTL = locale === 'ar';

  const navItems = role === 'ADMIN' || role === 'SUPER_ADMIN'
    ? adminNavItems
    : role === 'EMERGENCY_OPERATOR'
    ? operatorNavItems
    : userNavItems;

  return (
    <aside className={cn(
      'hidden md:flex flex-col w-64 border-e bg-card min-h-screen',
      isRTL ? 'border-l border-r-0' : ''
    )}>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isRTL ? 'flex-row-reverse' : '',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}>
                <Icon className="h-4 w-4 shrink-0" />
                <span>{labels[item.label] || item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="p-4">
        <Link href="/dashboard/account">
          <div className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            isRTL ? 'flex-row-reverse' : ''
          )}>
            <Settings className="h-4 w-4" />
            <span>{labels.settings || 'Settings'}</span>
          </div>
        </Link>
        <Button
          variant="ghost"
          className={cn('w-full justify-start gap-3 text-muted-foreground hover:text-destructive', isRTL ? 'flex-row-reverse' : '')}
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>{labels.signOut || 'Sign out'}</span>
        </Button>
      </div>
    </aside>
  );
}
