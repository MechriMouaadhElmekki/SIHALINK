import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  return (
    <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur text-center">
      <CardHeader>
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">تحقق من بريدك الإلكتروني</CardTitle>
        <CardDescription className="text-base mt-2">
          تم إرسال رسالة تحقق إلى بريدك الإلكتروني.<br />
          يرجى التحقق للمتابعة.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">لم تصلك الرسالة؟ تحقق من مجلد الرسائل غير المرغوب فيها.</p>
        <Button variant="outline" asChild className="w-full">
          <Link href="/login">العودة لتسجيل الدخول</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
