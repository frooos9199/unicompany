'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FiSearch, FiMapPin, FiBriefcase, FiUser } from 'react-icons/fi';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SearchPage() {
  const { locale, theme } = useAppStore();
  const isAr = locale === 'ar';
  const [searchType, setSearchType] = useState<'individuals' | 'companies'>('individuals');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ country: '', specialization: '', experience: '' });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      let q = query(usersRef, where('role', '==', searchType === 'individuals' ? 'individual' : 'company'));

      if (filters.country) {
        q = query(q, where('country', '==', filters.country));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Client-side filtering for text search
      const filtered = data.filter(item => {
        const name = (item as any).displayName?.toLowerCase() || '';
        const spec = (item as any).specialization?.toLowerCase() || '';
        const queryLower = searchQuery.toLowerCase();
        return !searchQuery || name.includes(queryLower) || spec.includes(queryLower);
      });

      setResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">
            {isAr ? 'البحث المتقدم' : 'Advanced Search'}
          </h1>

          {/* Search Type Toggle */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setSearchType('individuals')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                searchType === 'individuals'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] border border-[var(--border)]'
              }`}
            >
              <FiUser size={18} />
              {isAr ? 'أفراد' : 'Individuals'}
            </button>
            <button
              onClick={() => setSearchType('companies')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                searchType === 'companies'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] border border-[var(--border)]'
              }`}
            >
              <FiBriefcase size={18} />
              {isAr ? 'شركات' : 'Companies'}
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder={isAr ? 'ابحث بالاسم أو التخصص...' : 'Search by name or specialization...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<FiSearch />}
              />
            </div>
            <Button onClick={handleSearch} loading={loading}>
              {isAr ? 'بحث' : 'Search'}
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
            <Input
              placeholder={isAr ? 'الدولة' : 'Country'}
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              icon={<FiMapPin />}
            />
            <Input
              placeholder={isAr ? 'التخصص' : 'Specialization'}
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
              icon={<FiBriefcase />}
            />
            {searchType === 'individuals' && (
              <Input
                placeholder={isAr ? 'سنوات الخبرة' : 'Years of experience'}
                type="number"
                value={filters.experience}
                onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
              />
            )}
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, i) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-bold">
                      {result.displayName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)]">{result.displayName}</h3>
                      <p className="text-sm text-[var(--foreground-secondary)]">
                        {result.specialization || result.industry || ''}
                      </p>
                    </div>
                  </div>
                  {result.country && (
                    <p className="text-sm text-[var(--foreground-secondary)] flex items-center gap-1">
                      <FiMapPin size={14} /> {result.country}{result.city ? `, ${result.city}` : ''}
                    </p>
                  )}
                  {result.experienceYears && (
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                      {result.experienceYears} {isAr ? 'سنوات خبرة' : 'years experience'}
                    </p>
                  )}
                  <div className="mt-4">
                    <Button variant="secondary" size="sm" fullWidth>
                      {isAr ? 'عرض الملف' : 'View Profile'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {results.length === 0 && !loading && (
            <div className="text-center py-16 text-[var(--foreground-secondary)]">
              <FiSearch size={48} className="mx-auto mb-4 opacity-50" />
              <p>{isAr ? 'ابحث عن أفراد أو شركات' : 'Search for individuals or companies'}</p>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
