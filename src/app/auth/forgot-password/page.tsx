'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMail } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { useAppStore } from '@/store/useAppStore';
import { resetPassword } from '@/lib/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { FirebaseError } from 'firebase/app';

export default function ForgotPasswordPage() {
  const { locale, theme } = useAppStore();
  const isAr = locale === 'ar';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success(isAr ? 'تم إرسال رابط إعادة التعيين' : 'Reset link sent');
    } catch (error: unknown) {
      if (error instanceof FirebaseError && error.code === 'auth/too-many-requests') {
        toast.error(isAr ? 'تم تقييد إرسال الرسائل مؤقتًا بسبب كثرة المحاولات. انتظر قليلًا ثم أعد المحاولة.' : 'Reset emails are temporarily rate-limited after too many attempts. Please wait a bit and try again.');
      } else {
        toast.error(isAr ? 'تعذر إرسال الرابط' : 'Unable to send reset link');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)]">
      <Toaster position="top-center" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] bg-clip-text text-transparent">
              UniCompany
            </h1>
          </Link>
          <p className="mt-2 text-[var(--foreground-secondary)]">
            {isAr ? 'إعادة تعيين كلمة المرور' : 'Reset your password'}
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={isAr ? 'البريد الإلكتروني' : 'Email'}
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              icon={<FiMail />}
              required
            />

            <Button type="submit" fullWidth loading={loading}>
              {isAr ? 'إرسال رابط التعيين' : 'Send reset link'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--foreground-secondary)]">
            <Link href="/auth/login" className="text-[var(--primary-light)] font-medium hover:underline">
              {isAr ? 'العودة لتسجيل الدخول' : 'Back to login'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}