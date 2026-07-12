'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TrustedCompanies() {
  const { locale } = useAppStore();
  const isAr = locale === 'ar';
  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'company'), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      const names = snapshot.docs.map(d => d.data().companyName || d.data().displayName).filter(Boolean);
      setCompanies(names.length > 0 ? names : ['TechCorp', 'DevStudio', 'CloudBase', 'DataFlow', 'AppWorks', 'NetSolutions']);
    } catch {
      setCompanies(['TechCorp', 'DevStudio', 'CloudBase', 'DataFlow', 'AppWorks', 'NetSolutions']);
    }
  };

  if (companies.length === 0) return null;

  const doubled = [...companies, ...companies];

  return (
    <section className="py-12 sm:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <p className="text-center text-sm sm:text-base text-[var(--foreground-secondary)] font-medium">
          {isAr ? 'شركات مسجلة على المنصة' : 'Companies registered on the platform'}
        </p>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--background)] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--background)] to-transparent z-10" />
        <motion.div
          animate={{ x: isAr ? ['0%', '50%'] : ['0%', '-50%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="flex gap-8 sm:gap-12 items-center whitespace-nowrap"
        >
          {doubled.map((name, i) => (
            <div
              key={i}
              className="flex-shrink-0 px-6 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] font-semibold text-sm sm:text-base"
            >
              {name}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
