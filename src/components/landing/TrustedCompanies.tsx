'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/types';
import { getLocalizedCompanyName, getLocalizedIndustry } from '@/lib/i18n-content';

function getInitials(name?: string) {
  if (!name) return 'C';

  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

const fallbackCompanies: AppUser[] = [
  { uid: 'fallback-1', email: 'techcorp@example.com', role: 'company', displayName: 'TechCorp', companyName: 'TechCorp', createdAt: new Date(), updatedAt: new Date(), emailVerified: true, isActive: true, language: 'en', industry: 'Technology' },
  { uid: 'fallback-2', email: 'devstudio@example.com', role: 'company', displayName: 'DevStudio', companyName: 'DevStudio', createdAt: new Date(), updatedAt: new Date(), emailVerified: true, isActive: true, language: 'en', industry: 'Product Design' },
  { uid: 'fallback-3', email: 'cloudbase@example.com', role: 'company', displayName: 'CloudBase', companyName: 'CloudBase', createdAt: new Date(), updatedAt: new Date(), emailVerified: true, isActive: true, language: 'en', industry: 'Cloud' },
  { uid: 'fallback-4', email: 'dataflow@example.com', role: 'company', displayName: 'DataFlow', companyName: 'DataFlow', createdAt: new Date(), updatedAt: new Date(), emailVerified: true, isActive: true, language: 'en', industry: 'Analytics' },
];

export default function TrustedCompanies() {
  const { locale } = useAppStore();
  const isAr = locale === 'ar';
  const [companies, setCompanies] = useState<AppUser[]>([]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'company'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        const companyRecords = snapshot.docs.map((docSnapshot) => ({ uid: docSnapshot.id, ...docSnapshot.data() } as AppUser));
        setCompanies(companyRecords.length > 0 ? companyRecords : fallbackCompanies);
      } catch {
        setCompanies(fallbackCompanies);
      }
    };

    void loadCompanies();
  }, []);

  if (companies.length === 0) return null;

  const doubled = [...companies, ...companies];

  return (
    <section className="py-12 sm:py-16 overflow-hidden relative">
      <div className="absolute inset-x-0 top-8 h-40 bg-[radial-gradient(circle_at_center,_var(--primary-light)_0%,_transparent_65%)] opacity-10 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 relative z-10">
        <h2 className="text-center text-2xl sm:text-4xl font-bold text-[var(--foreground)] max-w-3xl mx-auto text-balance">
          {isAr ? 'الشركات التي تبني فرصًا حقيقية على المنصة' : 'Companies creating real opportunities on the platform'}
        </h2>
      </div>
      <div className="relative mt-10 sm:mt-12">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--background)] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--background)] to-transparent z-10" />
        <motion.div
          animate={{ x: isAr ? ['0%', '50%'] : ['0%', '-50%'] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
          className="flex gap-4 sm:gap-6 items-stretch whitespace-nowrap px-4"
        >
          {doubled.map((company, i) => (
            <Link
              key={`${company.uid}-${i}`}
              href={company.uid.startsWith('fallback-') ? '/companies' : `/companies/${company.uid}`}
              className="flex-shrink-0"
            >
              <div className="group w-[220px] sm:w-[260px] rounded-3xl border border-[var(--border)] bg-[color:color-mix(in_oklab,var(--card)_90%,white_10%)]/90 backdrop-blur-sm px-4 py-4 sm:px-5 sm:py-5 shadow-[0_18px_60px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  {company.avatar ? (
                    <img
                      src={company.avatar}
                      alt={getLocalizedCompanyName(company, locale) || company.companyName || company.displayName}
                      className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover border border-[var(--border)] bg-[var(--background-secondary)]"
                    />
                  ) : (
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] via-[var(--primary-light)] to-[var(--accent)] flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(getLocalizedCompanyName(company, locale) || company.companyName || company.displayName)}
                    </div>
                  )}
                  <div className="min-w-0 whitespace-normal">
                    <p className="text-[var(--foreground)] font-semibold text-sm sm:text-base leading-tight line-clamp-2">
                      {getLocalizedCompanyName(company, locale) || company.companyName || company.displayName}
                    </p>
                    <p className="text-[var(--foreground-secondary)] text-xs sm:text-sm mt-1 truncate">
                      {getLocalizedIndustry(company, locale) || (isAr ? 'شركة مسجلة' : 'Registered company')}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs sm:text-sm whitespace-normal">
                  <span className="inline-flex items-center rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[var(--accent)] font-medium">
                    {company.city || (isAr ? 'الكويت' : 'Kuwait')}
                  </span>
                  <span className="text-[var(--primary-light)] font-medium group-hover:text-[var(--primary)] transition-colors">
                    {isAr ? 'عرض الملف' : 'View profile'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
