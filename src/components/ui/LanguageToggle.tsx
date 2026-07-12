'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

export default function LanguageToggle() {
  const { locale, setLocale } = useAppStore();

  const toggle = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    setLocale(newLocale);
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      className="p-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all font-medium text-sm"
      aria-label="Toggle language"
    >
      {locale === 'ar' ? 'EN' : 'عربي'}
    </motion.button>
  );
}
