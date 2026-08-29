'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon, Globe, Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  unreadCount?: number;
  locale?: string;
}

export function Header({ title, subtitle, unreadCount = 0, locale = 'ar' }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  function setLocale(l: string) {
    document.cookie = `locale=${l};path=/;max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  }

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border h-16 flex items-center px-4 lg:px-6 gap-4">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        {title && <h1 className="text-lg font-bold truncate">{title}</h1>}
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="تغيير اللغة">
              <Globe className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLocale('ar')} className={cn(locale === 'ar' && 'font-bold')}>عربي</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocale('fr')} className={cn(locale === 'fr' && 'font-bold')}>Français</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocale('en')} className={cn(locale === 'en' && 'font-bold')}>English</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="تغيير المظهر"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/notifications" aria-label="الإشعارات">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Link>
        </Button>
      </div>
    </header>
  );
}
