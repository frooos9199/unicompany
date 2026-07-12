'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/ui/Button';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function Hero() {
  const { locale } = useAppStore();
  const isAr = locale === 'ar';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero opacity-90" />
      <div className="absolute inset-0">
        <div className="absolute top-10 left-5 sm:top-20 sm:left-10 w-40 h-40 sm:w-72 sm:h-72 bg-[var(--primary-light)] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute top-20 right-5 sm:top-40 sm:right-10 w-40 h-40 sm:w-72 sm:h-72 bg-[var(--accent)] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute bottom-10 left-1/2 w-40 h-40 sm:w-72 sm:h-72 bg-[var(--primary)] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs sm:text-sm font-medium mb-4 sm:mb-6"
          >
            {isAr ? '🚀 منصة المستقبل للتوظيف' : '🚀 The Future of Recruitment'}
          </motion.span>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            {isAr ? (
              <>
                <span className="block">منصة</span>
                <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] bg-clip-text text-transparent">
                  UniCompany
                </span>
              </>
            ) : (
              <>
                <span className="block">Welcome to</span>
                <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] bg-clip-text text-transparent">
                  UniCompany
                </span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8 sm:mb-10 px-2">
            {isAr
              ? 'الجسر بين الكفاءات والشركات الرائدة حول العالم. ارفع سيرتك الذاتية أو اعرض خدمات شركتك'
              : 'Bridging talents with leading companies worldwide. Upload your CV or showcase your company services'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button variant="accent" size="lg" fullWidth className="sm:!w-auto">
                {isAr ? 'ابدأ الآن' : 'Get Started'}
                {isAr ? <FiArrowLeft /> : <FiArrowRight />}
              </Button>
            </Link>
            <Link href="/companies" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" fullWidth className="text-white border border-white/30 hover:bg-white/10 sm:!w-auto">
                {isAr ? 'تصفح الشركات' : 'Browse Companies'}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-12 sm:mt-20 grid grid-cols-3 gap-4 sm:gap-8 max-w-sm sm:max-w-lg mx-auto"
        >
          {[
            { value: '500+', label: isAr ? 'مستخدم' : 'Users' },
            { value: '100+', label: isAr ? 'شركة' : 'Companies' },
            { value: '20+', label: isAr ? 'دولة' : 'Countries' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-white/60 text-xs sm:text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator - hidden on mobile */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-white/60 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
