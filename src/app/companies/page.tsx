'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FiMapPin, FiGlobe, FiBriefcase, FiUsers } from 'react-icons/fi';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function CompaniesPage() {
  const { locale, theme } = useAppStore();
  const isAr = locale === 'ar';
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'company'), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      setCompanies(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            {isAr ? 'الشركات' : 'Companies'}
          </h1>
          <p className="text-[var(--foreground-secondary)] mb-8">
            {isAr ? 'تصفح الشركات المسجلة على المنصة' : 'Browse registered companies on the platform'}
          </p>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 rounded-2xl bg-[var(--background-secondary)] animate-pulse" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-16 text-[var(--foreground-secondary)]">
              <FiBriefcase size={48} className="mx-auto mb-4 opacity-50" />
              <p>{isAr ? 'لا توجد شركات مسجلة حالياً' : 'No companies registered yet'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company, i) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white text-xl font-bold">
                        {company.companyName?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)]">{company.companyName}</h3>
                        {company.industry && (
                          <p className="text-sm text-[var(--foreground-secondary)]">{company.industry}</p>
                        )}
                      </div>
                    </div>

                    {company.description && (
                      <p className="text-sm text-[var(--foreground-secondary)] mb-4 line-clamp-3">
                        {company.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4 flex-1">
                      {company.country && (
                        <p className="text-sm text-[var(--foreground-secondary)] flex items-center gap-2">
                          <FiMapPin size={14} /> {company.country}{company.city ? `, ${company.city}` : ''}
                        </p>
                      )}
                      {company.website && (
                        <p className="text-sm text-[var(--foreground-secondary)] flex items-center gap-2">
                          <FiGlobe size={14} /> {company.website}
                        </p>
                      )}
                      {company.services?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {company.services.slice(0, 3).map((service: string, j: number) => (
                            <span key={j} className="px-2 py-0.5 rounded-full text-xs bg-[var(--accent)]/10 text-[var(--accent)]">
                              {service}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link href={`/companies/${company.id}`}>
                      <Button variant="secondary" size="sm" fullWidth>
                        {isAr ? 'عرض التفاصيل' : 'View Details'}
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
