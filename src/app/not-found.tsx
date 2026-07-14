'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiHome, FiSearch } from 'react-icons/fi';
import { useAppStore } from '@/store/useAppStore';

export default function NotFound() {
  const { locale, theme } = useAppStore();
  const isAr = locale === 'ar';

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl rounded-[2rem] border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--accent)]/10 p-8 sm:p-12 text-center"
      >
        <div className="inline-flex items-center rounded-full bg-[var(--primary)]/10 px-4 py-1.5 text-sm font-medium text-[var(--primary-light)] mb-5">
          404
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">
          {isAr ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h1>
        <p className="text-[var(--foreground-secondary)] text-sm sm:text-base max-w-2xl mx-auto leading-7">
          {isAr
            ? 'الرابط الذي فتحته غير متوفر حاليًا أو تم نقله. تقدر ترجع للرئيسية أو تستخدم البحث للوصول للشركات والمواهب والوظائف.'
            : 'The page you opened is unavailable or may have moved. You can return home or use search to continue browsing companies, talents, and jobs.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-xl mx-auto">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary-light)] px-5 py-3 text-white font-medium hover:opacity-90 transition-opacity">
            <FiHome size={18} />
            {isAr ? 'العودة للرئيسية' : 'Back Home'}
          </Link>
          <Link href="/search" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] px-5 py-3 font-medium text-[var(--foreground)] hover:border-[var(--primary-light)] hover:text-[var(--primary-light)] transition-colors">
            <FiSearch size={18} />
            {isAr ? 'الذهاب للبحث' : 'Go to Search'}
          </Link>
        </div>

        <Link href="/companies" className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary-light)] transition-colors">
          {isAr ? <FiArrowLeft size={16} /> : null}
          {isAr ? 'تصفح الشركات بدلًا من ذلك' : 'Browse companies instead'}
          {!isAr ? <FiArrowLeft size={16} /> : null}
        </Link>
      </motion.div>
    </main>
  );
}