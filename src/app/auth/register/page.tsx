'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { registerUser } from '@/lib/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiUser, FiBriefcase } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { FirebaseError } from 'firebase/app';
import { logoutUser } from '@/lib/auth';

type RegisterType = 'individual' | 'company' | null;

export default function RegisterPage() {
  const { locale, theme } = useAppStore();
  const router = useRouter();
  const isAr = locale === 'ar';
  const [loading, setLoading] = useState(false);
  const [registerType, setRegisterType] = useState<RegisterType>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    companyName: '',
    commercialRegistration: '',
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerType) {
      toast.error(isAr ? 'اختر نوع الحساب أولاً' : 'Select an account type first');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error(isAr ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const additionalData = registerType === 'company'
        ? {
            displayName: formData.companyName,
            companyName: formData.companyName,
            commercialRegistration: formData.commercialRegistration,
            services: [],
            projects: [],
            teamMembers: [],
            contactInfo: { email: formData.email },
          }
        : {
            displayName: formData.displayName,
            firstName: formData.displayName.split(' ')[0] || '',
            lastName: formData.displayName.split(' ').slice(1).join(' ') || '',
            skills: [],
            cvVisibility: 'request_only',
          };

      const result = await registerUser(formData.email, formData.password, registerType, additionalData);
      await logoutUser();
      if (result.verificationEmailSent) {
        toast.success(isAr ? 'تم إنشاء الحساب بنجاح. أرسلنا رسالة تحقق اختيارية إلى بريدك.' : 'Account created successfully. We sent an optional verification email to your inbox.');
      } else {
        toast.success(isAr ? 'تم إنشاء الحساب بنجاح ويمكنك تسجيل الدخول مباشرة.' : 'Account created successfully and you can log in immediately.');
      }
      router.push('/auth/login');
    } catch (error: unknown) {
      if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
        toast.error(isAr ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already in use');
      } else if (error instanceof FirebaseError && error.code === 'auth/too-many-requests') {
        toast.error(isAr ? 'تم تقييد التسجيل مؤقتًا من Firebase بسبب كثرة المحاولات. انتظر قليلًا ثم أعد المحاولة.' : 'Firebase temporarily rate-limited sign up after too many attempts. Please wait a bit and try again.');
      } else if (error instanceof FirebaseError && error.code === 'auth/weak-password') {
        toast.error(isAr ? 'كلمة المرور ضعيفة جدًا' : 'Password is too weak');
      } else {
        const message = error instanceof FirebaseError ? error.message : (isAr ? 'حدث خطأ، حاول مرة أخرى' : 'An error occurred, try again');
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[var(--background)]">
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
            {isAr ? 'إنشاء حساب جديد' : 'Create a new account'}
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-lg">
          {/* Type Selection */}
          <AnimatePresence mode="wait">
            {!registerType ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <p className="text-center font-medium text-[var(--foreground)] mb-6">
                  {isAr ? 'سجل كـ' : 'Register as'}
                </p>
                <button
                  onClick={() => setRegisterType('individual')}
                  className="w-full p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary-light)] hover:bg-[var(--background-secondary)] transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white">
                    <FiUser size={24} />
                  </div>
                  <div className="text-start">
                    <p className="font-semibold text-[var(--foreground)]">{isAr ? 'فرد' : 'Individual'}</p>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      {isAr ? 'ارفع سيرتك الذاتية وابحث عن فرص' : 'Upload your CV and find opportunities'}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setRegisterType('company')}
                  className="w-full p-4 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--background-secondary)] transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center text-[var(--primary-dark)]">
                    <FiBriefcase size={24} />
                  </div>
                  <div className="text-start">
                    <p className="font-semibold text-[var(--foreground)]">{isAr ? 'شركة' : 'Company'}</p>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      {isAr ? 'اعرض خدماتك وابحث عن كفاءات' : 'Showcase services and find talents'}
                    </p>
                  </div>
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <button
                  type="button"
                  onClick={() => setRegisterType(null)}
                  className="text-sm text-[var(--primary-light)] hover:underline mb-2"
                >
                  {isAr ? '← رجوع' : '← Back'}
                </button>

                {registerType === 'individual' ? (
                  <Input
                    label={isAr ? 'الاسم الكامل' : 'Full Name'}
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    icon={<FiUser />}
                    required
                  />
                ) : (
                  <>
                    <Input
                      label={isAr ? 'اسم الشركة' : 'Company Name'}
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      icon={<FiBriefcase />}
                      required
                    />
                    <Input
                      label={isAr ? 'رقم السجل التجاري' : 'Commercial Registration Number'}
                      name="commercialRegistration"
                      value={formData.commercialRegistration}
                      onChange={handleChange}
                      required
                    />
                  </>
                )}

                <Input
                  label={isAr ? 'البريد الإلكتروني' : 'Email'}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  icon={<FiMail />}
                  required
                />
                <Input
                  label={isAr ? 'كلمة المرور' : 'Password'}
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  icon={<FiLock />}
                  required
                />
                <Input
                  label={isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  icon={<FiLock />}
                  required
                />

                <Button type="submit" fullWidth loading={loading}>
                  {isAr ? 'إنشاء حساب' : 'Create Account'}
                </Button>

                <p className="text-xs text-[var(--foreground-secondary)] text-center">
                  {isAr ? 'التسجيل يعمل مباشرة. رسالة التحقق إن وصلت فهي اختيارية وليست شرطًا للدخول.' : 'Registration works immediately. Verification email is optional and no longer required for login.'}
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-sm text-[var(--foreground-secondary)]">
            {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <Link href="/auth/login" className="text-[var(--primary-light)] font-medium hover:underline">
              {isAr ? 'سجل دخول' : 'Login'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
