'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { loginUser, getUserProfile } from '@/lib/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { logoutUser } from '@/lib/auth';

export default function LoginPage() {
  const { locale, theme } = useAppStore();
  const { setUser } = useAuthStore();
  const router = useRouter();
  const isAr = locale === 'ar';
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      const profile = await getUserProfile(user.uid);
      if (!profile) {
        await logoutUser();
        throw new Error(isAr ? 'لا يوجد ملف مستخدم مرتبط بهذا الحساب' : 'No user profile found for this account');
      }

      setUser(profile as any);
      toast.success(isAr ? 'تم تسجيل الدخول بنجاح' : 'Login successful');
      if (profile.role === 'superadmin' || profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/profile');
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      toast.error(`${err.code || 'error'}: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)]">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] bg-clip-text text-transparent">
              UniCompany
            </h1>
          </Link>
          <p className="mt-2 text-[var(--foreground-secondary)]">
            {isAr ? 'تسجيل الدخول إلى حسابك' : 'Login to your account'}
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label={isAr ? 'البريد الإلكتروني' : 'Email'}
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<FiMail />}
              required
            />
            <Input
              label={isAr ? 'كلمة المرور' : 'Password'}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<FiLock />}
              required
            />

            <div className="flex items-center justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-[var(--primary-light)] hover:underline">
                {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading}>
              {isAr ? 'تسجيل الدخول' : 'Login'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--foreground-secondary)]">
            {isAr ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
            <Link href="/auth/register" className="text-[var(--primary-light)] font-medium hover:underline">
              {isAr ? 'سجل الآن' : 'Register'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
