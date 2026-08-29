'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Moon, Sun, Bell, BellOff, Shield, Lock,
  Info, ChevronRight, ExternalLink, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

function SettingRow({
  icon, label, description, right
}: { icon: React.ReactNode; label: string; description?: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="text-muted-foreground shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [smsNotifs, setSmsNotifs] = useState(true);

  const isDark = theme === 'dark';

  return (
    <div dir="rtl" className="pb-10">
      <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center gap-3 px-4 h-14">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile"><ArrowRight className="w-5 h-5" /></Link>
        </Button>
        <h1 className="font-bold text-base">الإعدادات</h1>
      </div>

      <div className="p-4 lg:p-6 space-y-5">
        {/* Appearance */}
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">المظهر</CardTitle></CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            <SettingRow
              icon={isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              label="الوضع الليلي"
              description="تبديل بين الوضع الفاتح والداكن"
              right={
                <Toggle checked={isDark} onChange={(v) => setTheme(v ? 'dark' : 'light')} />
              }
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">الإشعارات</CardTitle></CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            <SettingRow
              icon={<Bell className="w-4 h-4" />}
              label="إشعارات التطبيق"
              description="تنبيهات فورية عبر الجهاز"
              right={<Toggle checked={pushNotifs} onChange={setPushNotifs} />}
            />
            <SettingRow
              icon={<Smartphone className="w-4 h-4" />}
              label="إشعارات الرسائل النصية"
              description="إشعار هاتفي لتحديثات المواعيد"
              right={<Toggle checked={smsNotifs} onChange={setSmsNotifs} />}
            />
            <SettingRow
              icon={<BellOff className="w-4 h-4" />}
              label="إشعارات البريد الإلكتروني"
              right={<Toggle checked={emailNotifs} onChange={setEmailNotifs} />}
            />
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">الأمان</CardTitle></CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            <Link href="/forgot-password" className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">تغيير كلمة المرور</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
            </Link>
            <div className="flex items-center gap-3 px-4 py-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">التحقق بخطوتين</p>
                <p className="text-xs text-muted-foreground">سيتوفر قريباً</p>
              </div>
              <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-0.5 rounded-full">قريباً</span>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">حول التطبيق</CardTitle></CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <Info className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">SIHALINK</p>
                <p className="text-xs text-muted-foreground">الإصدار التجريبي — v0.1.0</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">سياسة الخصوصية</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Demo warning */}
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            ⚠️ هذا التطبيق في وضع تجريبي. بعض الإعدادات غير فعالة بعد.
            في حالة الطوارئ اتصل بـ <strong>1021</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
