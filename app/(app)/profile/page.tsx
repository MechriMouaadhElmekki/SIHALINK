'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Phone, Mail, MapPin, Calendar, Shield, LogOut, Loader2, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const LANGUAGES = [{ value: 'ar', label: 'العربية' }, { value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }];

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '',
    date_of_birth: '', blood_type: '',
    wilaya: '', city: '', address: '',
    preferred_language: 'ar',
    emergency_contact_name: '', emergency_contact_phone: '',
    medical_allergies: '', chronic_conditions: '',
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          phone: data.phone ?? '',
          date_of_birth: data.date_of_birth ?? '',
          blood_type: data.blood_type ?? '',
          wilaya: data.wilaya ?? '',
          city: data.city ?? '',
          address: data.address ?? '',
          preferred_language: data.preferred_language ?? 'ar',
          emergency_contact_name: data.emergency_contact_name ?? '',
          emergency_contact_phone: data.emergency_contact_phone ?? '',
          medical_allergies: data.medical_allergies ?? '',
          chronic_conditions: data.chronic_conditions ?? '',
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');
      toast({ title: 'تم حفظ التغييرات' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="pb-10">
      {/* Avatar header */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-500 p-6 pt-10 text-white text-center">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3">
          {form.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'م'}
        </div>
        <p className="text-xl font-bold">{form.first_name} {form.last_name}</p>
        <p className="text-blue-100 text-sm mt-0.5">{user?.email}</p>
      </div>

      <form onSubmit={handleSave} className="p-4 lg:p-6 space-y-5">
        {/* Personal info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" />المعلومات الشخصية</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="الاسم" value={form.first_name} onChange={v => set('first_name', v)} placeholder="الاسم" />
              <Field label="اللقب" value={form.last_name} onChange={v => set('last_name', v)} placeholder="اللقب" />
            </div>
            <Field label="رقم الهاتف" value={form.phone} onChange={v => set('phone', v)} placeholder="0xxxxxxxxx" type="tel" />
            <Field label="تاريخ الميلاد" value={form.date_of_birth} onChange={v => set('date_of_birth', v)} type="date" />
            <div className="space-y-1">
              <Label>فصيلة الدم</Label>
              <div className="flex flex-wrap gap-2">
                {BLOOD_TYPES.map(bt => (
                  <button key={bt} type="button"
                    onClick={() => set('blood_type', bt)}
                    className={`px-3 py-1 rounded-full border text-xs font-bold transition-all ${
                      form.blood_type === bt
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'border-border hover:border-red-300'
                    }`}>{bt}</button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4" />العنوان</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="الولاية" value={form.wilaya} onChange={v => set('wilaya', v)} placeholder="الجزائر" />
            <Field label="المدينة" value={form.city} onChange={v => set('city', v)} placeholder="الجزائر" />
            <Field label="العنوان التفصيلي" value={form.address} onChange={v => set('address', v)} placeholder="شارع، حي..." />
          </CardContent>
        </Card>

        {/* Emergency contact */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Phone className="w-4 h-4" />جهة اتصال الطوارئ</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="الاسم" value={form.emergency_contact_name} onChange={v => set('emergency_contact_name', v)} placeholder="اسم شخص للاتصال" />
            <Field label="رقم الهاتف" value={form.emergency_contact_phone} onChange={v => set('emergency_contact_phone', v)} placeholder="0xxxxxxxxx" type="tel" />
          </CardContent>
        </Card>

        {/* Medical info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" />المعلومات الطبية</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>الحساسية</Label>
              <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="أدوية، أغذية..."
                value={form.medical_allergies}
                onChange={e => set('medical_allergies', e.target.value)}
                maxLength={500}
              />
            </div>
            <div className="space-y-1">
              <Label>أمراض مزمنة</Label>
              <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="سكري، ضغط،..."
                value={form.chronic_conditions}
                onChange={e => set('chronic_conditions', e.target.value)}
                maxLength={500}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">لغة التطبيق</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {LANGUAGES.map(({ value, label }) => (
                <button key={value} type="button"
                  onClick={() => set('preferred_language', value)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    form.preferred_language === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-border hover:border-blue-300'
                  }`}>{label}</button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الحفظ...</> : <><Check className="w-4 h-4" /> حفظ التغييرات</>}
        </Button>

        {/* Settings links */}
        <Card>
          <CardContent className="p-0">
            <Link href="/settings" className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border">
              <span className="text-sm font-medium">الإعدادات</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">تسجيل الخروج</span>
            </button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
