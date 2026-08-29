'use client';
import { useState, useEffect } from 'react';
import { useEmergencyStore } from '@/store/emergency-report.store';
import type { LocationData } from '@/store/emergency-report.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, AlertTriangle, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import { WILAYAS } from '@/lib/utils';

type Mode = 'idle' | 'requesting' | 'success' | 'error' | 'manual';

export function StepLocation({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { draft, setLocation } = useEmergencyStore();
  const [mode, setMode] = useState<Mode>(draft.location ? 'success' : 'idle');
  const [location, setLoc] = useState<LocationData | null>(draft.location);
  const [error, setError] = useState('');
  const [manual, setManual] = useState({
    address: draft.location?.address || '',
    city: draft.location?.city || '',
    wilaya: draft.location?.wilaya || '',
    commune: draft.location?.commune || '',
  });

  function requestGPS() {
    setMode('requesting');
    setError('');
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع');
      setMode('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: LocationData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          is_manual: false,
        };
        setLoc(loc);
        setMode('success');
      },
      (err) => {
        setError(مشكلة في الحصول على الموقع. تحقق من الصلاحيات أو حدد الموقع يدوياً.);
        setMode('error');
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  }

  function confirmManual() {
    if (!manual.wilaya) return;
    const loc: LocationData = {
      latitude: 36.7538, // Default Algeria center
      longitude: 3.0588,
      address: manual.address || undefined,
      city: manual.city || undefined,
      wilaya: manual.wilaya,
      commune: manual.commune || undefined,
      is_manual: true,
    };
    setLoc(loc);
    setMode('success');
  }

  function handleNext() {
    if (!location) return;
    setLocation(location);
    onNext();
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h2 className="text-lg font-bold mb-1">موقع الحادثة</h2>
        <p className="text-sm text-muted-foreground">حدد موقعك ليتمكن المشغلون من إيجادك</p>
      </div>

      {mode === 'idle' && (
        <div className="space-y-3">
          <Button onClick={requestGPS} className="w-full" size="lg">
            <MapPin className="w-4 h-4" /> تحديد موقعي تلقائياً
          </Button>
          <Button variant="outline" onClick={() => setMode('manual')} className="w-full">
            <Edit3 className="w-4 h-4" /> إدخال العنوان يدوياً
          </Button>
        </div>
      )}

      {mode === 'requesting' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">جارٍ تحديد موقعك...</p>
        </div>
      )}

      {mode === 'error' && (
        <div className="space-y-3">
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
          <Button onClick={requestGPS} variant="outline" className="w-full">إعادة المحاولة</Button>
          <Button variant="ghost" onClick={() => setMode('manual')} className="w-full">إدخال يدوي</Button>
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>الولاية *</Label>
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={manual.wilaya}
              onChange={e => setManual(m => ({ ...m, wilaya: e.target.value }))}
            >
              <option value="">— اختر الولاية —</option>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>المدينة / البلدية</Label>
            <Input placeholder="الجزائر" value={manual.city} onChange={e => setManual(m => ({ ...m, city: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>العنوان <span className="text-muted-foreground text-xs">(اختياري)</span></Label>
            <Input placeholder="شارع، حي، رقم..." value={manual.address} onChange={e => setManual(m => ({ ...m, address: e.target.value }))} />
          </div>
          <Button onClick={confirmManual} disabled={!manual.wilaya} className="w-full">تأكيد الموقع</Button>
        </div>
      )}

      {mode === 'success' && location && (
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <p className="text-sm font-bold text-green-800 dark:text-green-300">تم تحديد الموقع</p>
          </div>
          {location.is_manual ? (
            <p className="text-sm text-green-700 dark:text-green-400">
              {[location.address, location.city, location.wilaya].filter(Boolean).join(' • ')}
            </p>
          ) : (
            <p className="text-sm text-green-700 dark:text-green-400">
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              {location.accuracy && ` (دقة: ±${Math.round(location.accuracy)}م)`}
            </p>
          )}
          <button
            type="button"
            onClick={() => { setLoc(null); setMode('idle'); }}
            className="text-xs text-green-600 underline"
          >تغيير الموقع</button>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronRight className="w-4 h-4" /> رجوع
        </Button>
        <Button onClick={handleNext} disabled={!location} className="flex-1">
          التالي <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
