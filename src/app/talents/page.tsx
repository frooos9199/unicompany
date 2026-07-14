'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FiMapPin, FiUser, FiSearch, FiSend, FiBriefcase, FiLayers, FiGlobe } from 'react-icons/fi';
import { collection, query, where, getDocs, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast, { Toaster } from 'react-hot-toast';
import { AppUser, CVRequest } from '@/types';
import { getCvRequestId } from '@/lib/cvProfiles';
import { getLocalizedSpecialization } from '@/lib/i18n-content';

export default function TalentsPage() {
  const { locale, theme } = useAppStore();
  const { user } = useAuthStore();
  const isAr = locale === 'ar';
  const [talents, setTalents] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterSkill, setFilterSkill] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  useEffect(() => {
    const loadTalents = async () => {
      try {
        const talentsQuery = query(collection(db, 'users'), where('role', '==', 'individual'), where('isActive', '==', true));
        const snapshot = await getDocs(talentsQuery);
        setTalents(snapshot.docs.map((docSnapshot) => ({ uid: docSnapshot.id, ...docSnapshot.data() } as AppUser)));
      } catch (error) {
        console.error('Error loading talents:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadTalents();
  }, []);

  const requestCV = async (talentId: string) => {
    if (!user || user.role !== 'company') {
      toast.error(isAr ? 'سجل كشركة لطلب السيرة الذاتية' : 'Register as a company to request CV');
      return;
    }

    try {
      const existingRequestSnapshot = await getDocs(query(
        collection(db, 'cvRequests'),
        where('companyId', '==', user.uid),
        where('individualId', '==', talentId),
      ));

      const existingRequests = existingRequestSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as CVRequest));
      const approvedRequest = existingRequests.find((request) => request.status === 'approved');
      const pendingRequest = existingRequests.find((request) => request.status === 'pending');

      if (approvedRequest) {
        toast.success(isAr ? 'تمت الموافقة مسبقًا على عرض السيرة الذاتية' : 'This CV has already been approved for your company');
        return;
      }

      if (pendingRequest) {
        toast(isAr ? 'يوجد طلب معلق بالفعل' : 'A pending request already exists');
        return;
      }

      const requestId = getCvRequestId(user.uid, talentId);

      await setDoc(doc(db, 'cvRequests', requestId), {
        id: requestId,
        companyId: user.uid,
        companyName: user.displayName,
        individualId: talentId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(collection(db, 'notifications')), {
        userId: talentId,
        type: 'cv_request',
        title: isAr ? 'طلب عرض السيرة الذاتية' : 'CV Access Request',
        message: isAr
          ? `${user.displayName} تطلب الاطلاع على سيرتك الذاتية`
          : `${user.displayName} is requesting access to your CV`,
        read: false,
        createdAt: serverTimestamp(),
        data: { companyId: user.uid, requestId },
      });

      toast.success(isAr ? 'تم إرسال الطلب' : 'Request sent');
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const filtered = talents.filter(t => {
    const localizedSpecialization = getLocalizedSpecialization(t, locale).toLowerCase();
    const matchesSearch = !searchQuery ||
      t.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      localizedSpecialization.includes(searchQuery.toLowerCase()) ||
      t.skills?.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCountry = !filterCountry || t.country?.toLowerCase().includes(filterCountry.toLowerCase());
    const matchesSkill = !filterSkill || t.skills?.some((skill) => skill.toLowerCase().includes(filterSkill.toLowerCase()));
    return matchesSearch && matchesCountry && matchesSkill;
  });

  const totalSkills = talents.reduce((sum, talent) => sum + (talent.skills?.length || 0), 0);
  const uniqueSpecializations = new Set(talents.map((talent) => getLocalizedSpecialization(talent, locale)).filter(Boolean)).size;

  return (
    <main>
      <Navbar />
      <Toaster position="top-center" />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-[2rem] border border-[var(--border)] bg-gradient-to-br from-[var(--accent)]/15 via-transparent to-[var(--primary-light)]/10 p-6 sm:p-8 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-2">
              {isAr ? 'طالبي العمل' : 'Talents'}
            </h1>
            <p className="text-[var(--foreground-secondary)] max-w-3xl text-sm sm:text-base">
              {isAr ? 'صفحة مكتملة لاستعراض المواهب مع التخصصات والمهارات وسنوات الخبرة، مع فلاتر واضحة لتسريع الوصول إلى المرشح المناسب.' : 'A complete talent directory with specializations, skills, and experience signals, plus clearer filters for faster candidate discovery.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                <div className="flex items-center gap-2 text-[var(--foreground-secondary)] text-sm mb-2">
                  <FiUser size={16} /> {isAr ? 'إجمالي المواهب' : 'Total Talents'}
                </div>
                <p className="text-2xl font-semibold text-[var(--foreground)]">{talents.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                <div className="flex items-center gap-2 text-[var(--foreground-secondary)] text-sm mb-2">
                  <FiLayers size={16} /> {isAr ? 'التخصصات' : 'Specializations'}
                </div>
                <p className="text-2xl font-semibold text-[var(--foreground)]">{uniqueSpecializations}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                <div className="flex items-center gap-2 text-[var(--foreground-secondary)] text-sm mb-2">
                  <FiGlobe size={16} /> {isAr ? 'المهارات المدرجة' : 'Listed Skills'}
                </div>
                <p className="text-2xl font-semibold text-[var(--foreground)]">{totalSkills}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr_0.8fr] gap-3 mb-8">
            <Input
              placeholder={isAr ? 'ابحث بالاسم أو التخصص أو المهارة...' : 'Search by name, specialization, or skill...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<FiSearch />}
            />
            <Input
              placeholder={isAr ? 'الدولة' : 'Country'}
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              icon={<FiMapPin />}
            />
            <Input
              placeholder={isAr ? 'فلترة بالمهارة' : 'Filter by skill'}
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              icon={<FiBriefcase />}
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
                (() => {
                  const skills = talent.skills ?? [];

                  return (
                <motion.div
                  key={talent.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full flex flex-col group">
                    <Link href={`/talents/${talent.uid}`} className="block flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {talent.avatar ? (
                          <img
                            src={talent.avatar}
                            alt={talent.displayName || 'Talent avatar'}
                            className="w-12 h-12 rounded-full object-cover border border-[var(--border)] bg-[var(--background-secondary)]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center text-[var(--primary-dark)] font-bold">
                            {talent.displayName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[var(--foreground)] truncate">{talent.displayName}</h3>
                          {getLocalizedSpecialization(talent, locale) && (
                            <p className="text-xs text-[var(--primary-light)]">{getLocalizedSpecialization(talent, locale)}</p>
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

                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {skills.slice(0, 4).map((skill, j) => (
                            <span key={j} className="px-2 py-0.5 rounded-full text-xs bg-[var(--primary-light)]/10 text-[var(--primary-light)]">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                        <div className="rounded-xl bg-[var(--background-secondary)] px-2 py-2">
                          <p className="text-[10px] text-[var(--foreground-secondary)] mb-1">{isAr ? 'المهارات' : 'Skills'}</p>
                          <p className="text-sm font-semibold text-[var(--foreground)]">{skills.length}</p>
                        </div>
                        <div className="rounded-xl bg-[var(--background-secondary)] px-2 py-2">
                          <p className="text-[10px] text-[var(--foreground-secondary)] mb-1">{isAr ? 'الخبرة' : 'Experience'}</p>
                          <p className="text-sm font-semibold text-[var(--foreground)]">{talent.experienceYears || 0}</p>
                        </div>
                        <div className="rounded-xl bg-[var(--background-secondary)] px-2 py-2">
                          <p className="text-[10px] text-[var(--foreground-secondary)] mb-1">{isAr ? 'التخصص' : 'Focus'}</p>
                          <p className="text-sm font-semibold text-[var(--foreground)] truncate">{getLocalizedSpecialization(talent, locale) || '-'}</p>
                        </div>
                      </div>

                      <div className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors group-hover:border-[var(--primary-light)] group-hover:text-[var(--primary-light)]">
                        {isAr ? 'عرض الملف' : 'View Profile'}
                      </div>
                    </Link>

                    {user?.role === 'company' && talent.hasCv && (
                      <div className="mt-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onClick={() => {
                            void requestCV(talent.uid);
                          }}
                        >
                          <FiSend size={14} />
                          {isAr ? 'طلب السيرة الذاتية' : 'Request CV'}
                        </Button>
                      </div>
                    )}
                    {user?.role === 'company' && !talent.hasCv && (
                      <p className="mt-3 text-xs text-[var(--foreground-secondary)] text-center">{isAr ? 'لا توجد سيرة ذاتية مرفوعة حاليًا' : 'No CV uploaded yet'}</p>
                    )}
                  </Card>
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
