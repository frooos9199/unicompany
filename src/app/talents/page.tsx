'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FiMapPin, FiUser, FiSearch, FiSend } from 'react-icons/fi';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast, { Toaster } from 'react-hot-toast';

export default function TalentsPage() {
  const { locale, theme } = useAppStore();
  const { user } = useAuthStore();
  const isAr = locale === 'ar';
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  useEffect(() => {
    loadTalents();
  }, []);

  const loadTalents = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'individual'), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      setTalents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error loading talents:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestCV = async (talentId: string, talentName: string) => {
    if (!user || user.role !== 'company') {
      toast.error(isAr ? 'سجل كشركة لطلب السيرة الذاتية' : 'Register as a company to request CV');
      return;
    }

    try {
      await addDoc(collection(db, 'cvRequests'), {
        companyId: user.uid,
        companyName: user.displayName,
        individualId: talentId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'notifications'), {
        userId: talentId,
        type: 'cv_request',
        title: isAr ? 'طلب عرض السيرة الذاتية' : 'CV Access Request',
        message: isAr
          ? `${user.displayName} تطلب الاطلاع على سيرتك الذاتية`
          : `${user.displayName} is requesting access to your CV`,
        read: false,
        createdAt: serverTimestamp(),
        data: { companyId: user.uid },
      });

      toast.success(isAr ? 'تم إرسال الطلب' : 'Request sent');
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const filtered = talents.filter(t => {
    const matchesSearch = !searchQuery ||
      t.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.skills?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCountry = !filterCountry || t.country?.toLowerCase().includes(filterCountry.toLowerCase());
    return matchesSearch && matchesCountry;
  });

  return (
    <main>
      <Navbar />
      <Toaster position="top-center" />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2">
            {isAr ? 'طالبي العمل' : 'Talents'}
          </h1>
          <p className="text-[var(--foreground-secondary)] text-sm mb-6">
            {isAr ? 'تصفح الكفاءات المسجلة واطلب السيرة الذاتية' : 'Browse registered talents and request their CV'}
          </p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="flex-1">
              <Input
                placeholder={isAr ? 'ابحث بالاسم أو التخصص أو المهارة...' : 'Search by name, specialization, or skill...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<FiSearch />}
              />
            </div>
            <Input
              placeholder={isAr ? 'الدولة' : 'Country'}
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              icon={<FiMapPin />}
              className="sm:w-48"
            />
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 rounded-2xl bg-[var(--background-secondary)] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[var(--foreground-secondary)]">
              <FiUser size={48} className="mx-auto mb-4 opacity-50" />
              <p>{isAr ? 'لا توجد نتائج' : 'No results found'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filtered.map((talent, i) => (
                <motion.div
                  key={talent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center text-[var(--primary-dark)] font-bold">
                        {talent.displayName?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--foreground)] truncate">{talent.displayName}</h3>
                        {talent.specialization && (
                          <p className="text-xs text-[var(--primary-light)]">{talent.specialization}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-[var(--foreground-secondary)] mb-3">
                      {talent.country && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--background-secondary)]">
                          <FiMapPin size={12} /> {talent.country}{talent.city ? `, ${talent.city}` : ''}
                        </span>
                      )}
                      {talent.experienceYears && (
                        <span className="px-2 py-1 rounded-lg bg-[var(--background-secondary)]">
                          {talent.experienceYears} {isAr ? 'سنوات خبرة' : 'yrs exp'}
                        </span>
                      )}
                    </div>

                    {talent.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4 flex-1">
                        {talent.skills.slice(0, 4).map((skill: string, j: number) => (
                          <span key={j} className="px-2 py-0.5 rounded-full text-xs bg-[var(--primary-light)]/10 text-[var(--primary-light)]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {user?.role === 'company' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={() => requestCV(talent.id, talent.displayName)}
                      >
                        <FiSend size={14} />
                        {isAr ? 'طلب السيرة الذاتية' : 'Request CV'}
                      </Button>
                    )}
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
