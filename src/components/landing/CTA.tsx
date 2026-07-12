'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function CTA() {
  const { locale } = useAppStore();
  const isAr = locale === 'ar';

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto rounded-2xl sm:rounded-3xl gradient-hero p-8 sm:p-12 md:p-16 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 bg-[var(--accent)] rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-64 sm:h-64 bg-[var(--primary-light)] rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            {isAr ? 'جاهز تبدأ؟' : 'Ready to Start?'}
          </h2>
          <p className="text-white/80 text-sm sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">
            {isAr
              ? 'انضم لآلاف المستخدمين والشركات على منصة UniCompany'
              : 'Join thousands of users and companies on UniCompany platform'}
          </p>
          <Link href="/auth/register">
            <Button variant="accent" size="lg">
              {isAr ? 'سجل الآن مجاناً' : 'Register Now for Free'}
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
