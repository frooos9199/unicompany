'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { FiMapPin, FiGlobe, FiBriefcase, FiSearch, FiLayers, FiUsers } from 'react-icons/fi';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { AppUser } from '@/types';
import { getLocalizedCompanyDescription, getLocalizedCompanyName, getLocalizedIndustry, getLocalizedServices } from '@/lib/i18n-content';

export default function CompaniesPage() {
  const { locale, theme } = useAppStore();
  const isAr = locale === 'ar';
  const [companies, setCompanies] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesQuery = query(collection(db, 'users'), where('role', '==', 'company'), where('isActive', '==', true));
        const snapshot = await getDocs(companiesQuery);
        setCompanies(snapshot.docs.map((docSnapshot) => ({ uid: docSnapshot.id, ...docSnapshot.data() } as AppUser)));
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadCompanies();
  }, []);

  const filteredCompanies = companies.filter((company) => {
    const localizedName = getLocalizedCompanyName(company, locale).toLowerCase();
    const localizedDescription = getLocalizedCompanyDescription(company, locale).toLowerCase();
    const localizedServices = getLocalizedServices(company, locale);
    const search = searchQuery.trim().toLowerCase();
    const industry = industryFilter.trim().toLowerCase();

    const matchesSearch = !search ||
      localizedName.includes(search) ||
      localizedDescription.includes(search) ||
      localizedServices.some((service) => service.toLowerCase().includes(search));

    const matchesIndustry = !industry || getLocalizedIndustry(company, locale).toLowerCase().includes(industry);

    return matchesSearch && matchesIndustry;
  });

  const totalServices = companies.reduce((sum, company) => sum + (company.services?.length || 0), 0);
  const uniqueIndustries = new Set(companies.map((company) => company.industry).filter(Boolean)).size;

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-[2rem] border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--accent)]/10 p-6 sm:p-8 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-2">
              {isAr ? 'الشركات' : 'Companies'}
            </h1>
            <p className="text-[var(--foreground-secondary)] max-w-3xl">
              {isAr ? 'صفحة جاهزة لاستعراض الشركات المسجلة مع نبذة واضحة، تصنيف سريع، ومؤشرات مختصرة تساعد على الوصول للشركة المناسبة.' : 'A complete directory for browsing registered companies with quick classification, concise summaries, and clearer discovery signals.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                <div className="flex items-center gap-2 text-[var(--foreground-secondary)] text-sm mb-2">
                  <FiBriefcase size={16} /> {isAr ? 'إجمالي الشركات' : 'Total Companies'}
                </div>
                <p className="text-2xl font-semibold text-[var(--foreground)]">{companies.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                <div className="flex items-center gap-2 text-[var(--foreground-secondary)] text-sm mb-2">
                  <FiLayers size={16} /> {isAr ? 'القطاعات' : 'Industries'}
                </div>
                <p className="text-2xl font-semibold text-[var(--foreground)]">{uniqueIndustries}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                <div className="flex items-center gap-2 text-[var(--foreground-secondary)] text-sm mb-2">
                  <FiUsers size={16} /> {isAr ? 'الخدمات المعروضة' : 'Listed Services'}
                </div>
                <p className="text-2xl font-semibold text-[var(--foreground)]">{totalServices}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4 mb-8">
            <Input
              placeholder={isAr ? 'ابحث باسم الشركة أو الوصف أو الخدمة...' : 'Search by company name, description, or service...'}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              icon={<FiSearch />}
            />
            <Input
              placeholder={isAr ? 'فلترة بالمجال' : 'Filter by industry'}
              value={industryFilter}
              onChange={(event) => setIndustryFilter(event.target.value)}
              icon={<FiBriefcase />}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 rounded-2xl bg-[var(--background-secondary)] animate-pulse" />
              ))}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-16 text-[var(--foreground-secondary)]">
              <FiBriefcase size={48} className="mx-auto mb-4 opacity-50" />
              <p>{isAr ? 'لا توجد شركات مطابقة للفلاتر الحالية' : 'No companies match the current filters'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company, i) => (
                (() => {
                  const services = getLocalizedServices(company, locale);
                  const localizedName = getLocalizedCompanyName(company, locale);
                  const localizedDescription = getLocalizedCompanyDescription(company, locale);
                  const localizedIndustry = getLocalizedIndustry(company, locale);

                  return (
                <motion.div
                  key={company.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/companies/${company.uid}`} className="block h-full">
                    <Card className="h-full flex flex-col group">
                      <div className="flex items-center gap-3 mb-4">
                        {company.avatar ? (
                          <img
                            src={company.avatar}
                            alt={localizedName || company.companyName || 'Company logo'}
                            className="w-14 h-14 rounded-xl object-cover border border-[var(--border)] bg-[var(--background-secondary)]"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white text-xl font-bold">
                            {(localizedName || company.companyName)?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-[var(--foreground)]">{localizedName || company.companyName}</h3>
                          {localizedIndustry && (
                            <p className="text-sm text-[var(--foreground-secondary)]">{localizedIndustry}</p>
                          )}
                        </div>
                      </div>

                      {localizedDescription && (
                        <p className="text-sm text-[var(--foreground-secondary)] mb-4 line-clamp-3">
                          {localizedDescription}
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
                        {services.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {services.slice(0, 3).map((service, j) => (
                              <span key={j} className="px-2 py-0.5 rounded-full text-xs bg-[var(--accent)]/10 text-[var(--accent)]">
                                {service}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="pt-3 mt-3 border-t border-[var(--border)] grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-[var(--background-secondary)] px-2 py-2">
                            <p className="text-[10px] text-[var(--foreground-secondary)] mb-1">{isAr ? 'الخدمات' : 'Services'}</p>
                            <p className="text-sm font-semibold text-[var(--foreground)]">{company.services?.length || 0}</p>
                          </div>
                          <div className="rounded-xl bg-[var(--background-secondary)] px-2 py-2">
                            <p className="text-[10px] text-[var(--foreground-secondary)] mb-1">{isAr ? 'المشاريع' : 'Projects'}</p>
                            <p className="text-sm font-semibold text-[var(--foreground)]">{company.projects?.length || 0}</p>
                          </div>
                          <div className="rounded-xl bg-[var(--background-secondary)] px-2 py-2">
                            <p className="text-[10px] text-[var(--foreground-secondary)] mb-1">{isAr ? 'الحجم' : 'Size'}</p>
                            <p className="text-sm font-semibold text-[var(--foreground)] capitalize">{company.size || '-'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors group-hover:border-[var(--primary-light)] group-hover:text-[var(--primary-light)]">
                        {isAr ? 'عرض التفاصيل' : 'View Details'}
                      </div>
                    </Card>
                  </Link>
                </motion.div>
                  );
                })()
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
