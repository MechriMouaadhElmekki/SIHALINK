"use client";
import React, { useState } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: { name?: string; email?: string; avatar?: string } | null;
  role?: string;
  locale?: string;
  navLabels?: Record<string, string>;
  onSignOut?: () => void;
  unreadNotifications?: number;
}

export function DashboardLayout({
  children,
  user,
  role = 'USER',
  locale = 'ar',
  navLabels = {},
  onSignOut = () => {},
  unreadNotifications = 0,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isRTL = locale === 'ar';

  return (
    <div className={cn('min-h-screen bg-background', isRTL ? 'rtl' : 'ltr')} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar
        user={user}
        unreadNotifications={unreadNotifications}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        locale={locale}
      />
      <div className="flex">
        <Sidebar
          role={role}
          locale={locale}
          labels={navLabels}
          onSignOut={onSignOut}
        />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
