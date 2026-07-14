'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';
import { useAppStore } from '@/store/useAppStore';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale, theme } = useAppStore();
  const isAr = locale === 'ar';

  useEffect(() => {
    console.error(error);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  }, [error, isAr, theme]);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl rounded-[2rem] border border-[var(--border)] bg-gradient-to-br from-[var(--error)]/10 via-transparent to-[var(--accent)]/10 p-8 sm:p-12 text-center"
      >
        <div className="inline-flex items-center rounded-full bg-[var(--error)]/10 px-4 py-1.5 text-sm font-medium text-[var(--error)] mb-5">
          {isAr ? 'خطأ غير متوقع' : 'Unexpected Error'}
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">
          {isAr ? 'صار خطأ أثناء تحميل الصفحة' : 'Something Went Wrong'}
        </h1>
        <p className="text-[var(--foreground-secondary)] text-sm sm:text-base max-w-2xl mx-auto leading-7">
          {isAr
            ? 'واجهة الصفحة لم تكتمل بالشكل الصحيح. تقدر تعيد المحاولة الآن أو تروح للبحث وتكمل التصفح بدون توقف.'
            : 'This page did not finish rendering correctly. You can retry now or move to search and continue browsing without getting blocked.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-xl mx-auto">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary-light)] px-5 py-3 text-white font-medium hover:opacity-90 transition-opacity"
          >
            <FiRefreshCw size={18} />
            {isAr ? 'إعادة المحاولة' : 'Try Again'}
          </button>
          <Link href="/search" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] px-5 py-3 font-medium text-[var(--foreground)] hover:border-[var(--primary-light)] hover:text-[var(--primary-light)] transition-colors">
            <FiSearch size={18} />
            {isAr ? 'الذهاب للبحث' : 'Go to Search'}
          </Link>
        </div>
      </motion.div>
    </main>
  );
}