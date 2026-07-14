'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/lib/firebase';
import { AppUser, CVProfile, CVRequest } from '@/types';
import { findOrCreateConversation } from '@/lib/chat';
import { FiBriefcase, FiFileText, FiMapPin, FiMessageSquare, FiLock } from 'react-icons/fi';
import { getCvProfile, getCvRequestId } from '@/lib/cvProfiles';
import { getLocalizedArray, getLocalizedBio, getLocalizedEducationDegree, getLocalizedEducationField, getLocalizedEducationInstitution, getLocalizedExperienceCompany, getLocalizedExperienceDescription, getLocalizedExperiencePosition, getLocalizedSpecialization, getLocalizedUserTitle } from '@/lib/i18n-content';

function normalizeTokens(...values: Array<string | undefined>) {
  return new Set(
    values
      .flatMap((value) => (value || '').toLowerCase().split(/[^\p{L}\p{N}]+/u))
      .map((token) => token.trim())
      .filter((token) => token.length > 2),
  );
}

function scoreTalentSimilarity(baseTalent: AppUser, candidate: AppUser) {
  let score = 0;

  if (baseTalent.specialization && candidate.specialization && baseTalent.specialization === candidate.specialization) {
    score += 4;
  }

  if (baseTalent.country && candidate.country && baseTalent.country === candidate.country) {
    score += 1;
  }

  if (
    typeof baseTalent.experienceYears === 'number' &&
    typeof candidate.experienceYears === 'number' &&
    Math.abs(baseTalent.experienceYears - candidate.experienceYears) <= 2
  ) {
    score += 1;
  }

  const baseSkills = new Set(baseTalent.skills ?? []);
  const sharedSkills = (candidate.skills ?? []).filter((skill) => baseSkills.has(skill)).length;
  score += sharedSkills * 2;

  const baseTokens = normalizeTokens(baseTalent.specialization, baseTalent.bio, baseTalent.title, ...(baseTalent.skills ?? []));
  const candidateTokens = normalizeTokens(candidate.specialization, candidate.bio, candidate.title, ...(candidate.skills ?? []));
  let textOverlap = 0;
  candidateTokens.forEach((token) => {
    if (baseTokens.has(token)) {
      textOverlap += 1;
    }
  });
  score += Math.min(textOverlap, 4);

  return score;
}

export default function TalentDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { locale, theme } = useAppStore();
  const { user } = useAuthStore();
  const isAr = locale === 'ar';
  const [talent, setTalent] = useState<AppUser | null>(null);
  const [cvProfile, setCvProfile] = useState<CVProfile | null>(null);
  const [similarTalents, setSimilarTalents] = useState<AppUser[]>([]);
  const [cvRequestStatus, setCvRequestStatus] = useState<CVRequest['status'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  useEffect(() => {
    const loadTalent = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'users', params.id));

        if (!snapshot.exists()) {
          return;
        }

        const talentProfile = { uid: snapshot.id, ...snapshot.data() } as AppUser;
        setTalent(talentProfile);

        const similarQuery = query(
          collection(db, 'users'),
          where('role', '==', 'individual'),
          where('isActive', '==', true),
          limit(12),
        );
        const similarSnapshot = await getDocs(similarQuery);
        const related = similarSnapshot.docs
          .map((docSnapshot) => ({ uid: docSnapshot.id, ...docSnapshot.data() } as AppUser))
          .filter((item) => item.uid !== params.id)
          .map((item) => ({ item, score: scoreTalentSimilarity(talentProfile, item) }))
          .filter(({ score }) => score > 0)
          .sort((left, right) => right.score - left.score)
          .map(({ item }) => item)
          .slice(0, 3);

        setSimilarTalents(related);
      } finally {
        setLoading(false);
      }
    };

    void loadTalent();
  }, [params.id]);

  useEffect(() => {
    const loadCvAccess = async () => {
      if (!user || user.role !== 'company' || !talent) {
        setCvRequestStatus(null);
        return;
      }

      const requestSnapshot = await getDoc(doc(db, 'cvRequests', getCvRequestId(user.uid, talent.uid)));
      if (!requestSnapshot.exists()) {
        setCvRequestStatus(null);
        return;
      }

      setCvRequestStatus((requestSnapshot.data() as CVRequest).status);
    };

    void loadCvAccess();
  }, [talent, user]);

  const canManageOwnCv = user?.uid === talent?.uid || user?.role === 'admin' || user?.role === 'superadmin';
  const canAttemptCvRead = useMemo(() => {
    if (!talent?.hasCv) {
      return false;
    }

    if (canManageOwnCv) {
      return true;
    }

    if (talent.cvVisibility === 'public' && user?.role === 'company') {
      return true;
    }

    return Boolean(user?.role === 'company' && cvRequestStatus === 'approved');
  }, [canManageOwnCv, cvRequestStatus, talent, user?.role]);

  useEffect(() => {
    const loadCvProfile = async () => {
      if (!talent || !canAttemptCvRead) {
        setCvProfile(null);
        return;
      }

      const profile = await getCvProfile(talent.uid);
      setCvProfile(profile);
    };

    void loadCvProfile();
  }, [canAttemptCvRead, talent]);

  const handleDirectContact = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!talent) return;

    try {
      const conversationId = await findOrCreateConversation(user, talent);
      router.push(`/chat?conversation=${conversationId}`);
    } catch {
      toast.error(isAr ? 'تعذر فتح المحادثة' : 'Could not open conversation');
    }
  };

  if (loading) {
    return (
      <main>
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="h-80 rounded-3xl bg-[var(--background-secondary)] animate-pulse" />
        </div>
        <Footer />
      </main>
    );
  }

  if (!talent) {
    return (
      <main>
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center text-[var(--foreground-secondary)]">
          {isAr ? 'لم يتم العثور على الملف الشخصي' : 'Profile not found'}
        </div>
        <Footer />
      </main>
    );
  }

  const canViewCv = Boolean(cvProfile?.cvFile && canAttemptCvRead);
  const skills = talent.skills ?? [];
  const localizedSpecialization = getLocalizedSpecialization(talent, locale);
  const localizedBio = getLocalizedBio(talent, locale);
  const localizedTitle = getLocalizedUserTitle(talent, locale);
  const cvData = canViewCv ? cvProfile?.cvData : undefined;
  const experience = cvData?.experience ?? [];
  const education = cvData?.education ?? [];
  const certifications = getLocalizedArray(cvData?.certifications, cvData?.certificationsAr, locale);
  const languages = getLocalizedArray(cvData?.languages, cvData?.languagesAr, locale);

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card hover={false} className="overflow-hidden">
            <div className="rounded-3xl bg-gradient-to-br from-[var(--accent)]/15 via-transparent to-[var(--primary-light)]/10 p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
                <div className="flex items-start gap-4 sm:gap-5">
                  {talent.avatar ? (
                    <img
                      src={talent.avatar}
                      alt={talent.displayName || 'Talent avatar'}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border border-[var(--border)] bg-[var(--background-secondary)]"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center text-[var(--primary-dark)] text-3xl font-bold">
                      {talent.displayName?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div>
                    <span className="inline-flex items-center rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)] mb-3">
                      {isAr ? 'ملف مرشح' : 'Talent Card'}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">{talent.displayName}</h1>
                    <p className="text-[var(--primary-light)] mt-1 font-medium">{localizedSpecialization || (isAr ? 'بدون تخصص محدد' : 'No specialization specified')}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--foreground-secondary)]">
                      {talent.country && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-secondary)] px-3 py-1.5">
                          <FiMapPin size={14} /> {talent.country}{talent.city ? `, ${talent.city}` : ''}
                        </span>
                      )}
                      {talent.experienceYears && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-secondary)] px-3 py-1.5">
                          <FiBriefcase size={14} /> {talent.experienceYears} {isAr ? 'سنوات خبرة' : 'years experience'}
                        </span>
                      )}
                      {canViewCv && cvProfile?.cvFile && (
                        <a
                          href={cvProfile.cvFile}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-[var(--background-secondary)] px-3 py-1.5 hover:text-[var(--primary-light)] transition-colors"
                        >
                          <FiFileText size={14} /> {isAr ? 'عرض السيرة' : 'View CV'}
                        </a>
                      )}
                    </div>
                    {user && user.uid !== talent.uid && user.role === 'company' && (
                      <div className="mt-5">
                        <div className="flex flex-wrap gap-3">
                          <Button variant="secondary" onClick={handleDirectContact}>
                            <FiMessageSquare size={16} />
                            {isAr ? 'تواصل مع المرشح' : 'Contact Talent'}
                          </Button>
                          {talent.hasCv && !canViewCv && (
                            <Link href="/talents" className="inline-flex">
                              <Button variant="secondary">
                                <FiFileText size={16} />
                                {cvRequestStatus === 'pending'
                                  ? (isAr ? 'طلب السيرة قيد المراجعة' : 'CV request pending')
                                  : cvRequestStatus === 'rejected'
                                    ? (isAr ? 'تم رفض الطلب سابقًا' : 'Previous request was rejected')
                                    : (isAr ? 'اطلب السيرة من صفحة المواهب' : 'Request CV from talents page')}
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                    <p className="text-xs text-[var(--foreground-secondary)] mb-1">{isAr ? 'المهارات' : 'Skills'}</p>
                    <p className="text-2xl font-semibold text-[var(--foreground)]">{skills.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                    <p className="text-xs text-[var(--foreground-secondary)] mb-1">{isAr ? 'اللغة' : 'Language'}</p>
                    <p className="text-2xl font-semibold text-[var(--foreground)] uppercase">{talent.language || 'en'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 mt-8">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">{isAr ? 'معلومات رئيسية' : 'Main Information'}</h2>
                  <p className="text-[var(--foreground-secondary)] leading-7">
                    {localizedBio || (isAr ? 'هذا الملف يعرض المعلومات الأساسية للمرشح مع أهم المهارات والخبرة والموقع لتسهيل الوصول السريع.' : 'This card highlights the talent’s key information, skills, experience, and location for faster discovery.')}
                  </p>
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">{isAr ? 'أهم المهارات' : 'Top Skills'}</h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.length > 0 ? skills.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-full text-sm bg-[var(--primary-light)]/10 text-[var(--primary-light)]">
                        {skill}
                      </span>
                    )) : (
                      <p className="text-[var(--foreground-secondary)] text-sm">{isAr ? 'لا توجد مهارات مضافة بعد' : 'No skills added yet'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">{isAr ? 'الملف المهني' : 'Professional Snapshot'}</h2>
                  <div className="space-y-3 text-sm text-[var(--foreground-secondary)]">
                    <p><span className="text-[var(--foreground)] font-medium">{isAr ? 'المسمى:' : 'Title:'}</span> {localizedTitle || '-'}</p>
                    <p><span className="text-[var(--foreground)] font-medium">{isAr ? 'التخصص:' : 'Specialization:'}</span> {localizedSpecialization || '-'}</p>
                    <p><span className="text-[var(--foreground)] font-medium">{isAr ? 'سنوات الخبرة:' : 'Experience:'}</span> {talent.experienceYears || 0}</p>
                    <p><span className="text-[var(--foreground)] font-medium">{isAr ? 'البريد الإلكتروني:' : 'Email:'}</span> {talent.email}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">{isAr ? 'اللغات والشهادات' : 'Languages and Certifications'}</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)] mb-2">{isAr ? 'اللغات' : 'Languages'}</p>
                      <div className="flex flex-wrap gap-2">
                        {languages.length > 0 ? languages.map((language) => (
                          <span key={language} className="px-3 py-1 rounded-full text-sm bg-[var(--background-secondary)] text-[var(--foreground-secondary)]">{language}</span>
                        )) : <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد لغات مضافة' : 'No languages added'}</p>}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)] mb-2">{isAr ? 'الشهادات' : 'Certifications'}</p>
                      <div className="flex flex-wrap gap-2">
                        {certifications.length > 0 ? certifications.map((certification) => (
                          <span key={certification} className="px-3 py-1 rounded-full text-sm bg-[var(--accent)]/10 text-[var(--accent)]">{certification}</span>
                        )) : <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد شهادات مضافة' : 'No certifications added'}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">{isAr ? 'الوصول السريع' : 'Quick Actions'}</h2>
                  <div className="space-y-3">
                    {canViewCv && cvProfile?.cvFile && (
                      <a href={cvProfile.cvFile} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary-light)] hover:text-[var(--primary-light)] transition-colors">
                        {isAr ? 'فتح السيرة الذاتية' : 'Open CV'}
                      </a>
                    )}
                    {!canViewCv && talent.hasCv && (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3 text-sm text-[var(--foreground-secondary)] flex items-center justify-center gap-2">
                        <FiLock size={16} />
                        {talent.cvVisibility === 'private'
                          ? (isAr ? 'السيرة الذاتية خاصة بصاحب الملف فقط' : 'This CV is private to the profile owner')
                          : (isAr ? 'السيرة الذاتية تحتاج طلبًا وموافقة قبل العرض' : 'This CV requires a request and approval before viewing')}
                      </div>
                    )}
                    {!talent.hasCv && (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3 text-sm text-[var(--foreground-secondary)] flex items-center justify-center gap-2">
                        <FiFileText size={16} />
                        {isAr ? 'لا توجد سيرة ذاتية مرفوعة حاليًا' : 'No CV uploaded yet'}
                      </div>
                    )}
                    {user && user.uid !== talent.uid && user.role === 'company' && (
                      <Button variant="secondary" fullWidth onClick={handleDirectContact}>
                        <FiMessageSquare size={16} />
                        {isAr ? 'بدء محادثة مباشرة' : 'Start Direct Chat'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {!canViewCv && talent.hasCv && (
          <Card hover={false}>
            <div className="rounded-3xl bg-[var(--background-secondary)] p-6 text-center">
              <FiLock size={28} className="mx-auto mb-3 text-[var(--foreground-secondary)]" />
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">{isAr ? 'محتوى السيرة الذاتية غير متاح حاليًا' : 'CV content is not currently available'}</h2>
              <p className="text-[var(--foreground-secondary)] max-w-2xl mx-auto">
                {talent.cvVisibility === 'private'
                  ? (isAr ? 'صاحب الملف جعل السيرة الذاتية خاصة، لذلك لا تظهر تفاصيل الخبرة والتعليم والشهادات.' : 'The profile owner marked this CV as private, so work history, education, and certifications are hidden.')
                  : (isAr ? 'يمكنك طلب الوصول إلى السيرة الذاتية، وستظهر التفاصيل بعد موافقة صاحب الملف.' : 'You can request CV access, and the details will appear after the talent approves your request.')}
              </p>
            </div>
          </Card>
        )}

        {canViewCv && (experience.length > 0 || education.length > 0) && (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {experience.length > 0 && (
              <Card hover={false} className="h-full">
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">{isAr ? 'الخبرات العملية' : 'Work Experience'}</h2>
                <div className="space-y-4">
                  {experience.map((item, index) => (
                    <div key={`${item.company}-${index}`} className="rounded-2xl bg-[var(--background-secondary)] px-4 py-4 border border-[var(--border)]">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-semibold text-[var(--foreground)]">{getLocalizedExperiencePosition(item, locale)}</h3>
                          <p className="text-sm text-[var(--primary-light)]">{getLocalizedExperienceCompany(item, locale)}</p>
                        </div>
                        <span className="text-xs text-[var(--foreground-secondary)]">{item.startDate} - {item.current ? (isAr ? 'حتى الآن' : 'Present') : item.endDate || '-'}</span>
                      </div>
                      <p className="text-sm text-[var(--foreground-secondary)]">{getLocalizedExperienceDescription(item, locale)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {education.length > 0 && (
              <Card hover={false} className="h-full">
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">{isAr ? 'التعليم' : 'Education'}</h2>
                <div className="space-y-4">
                  {education.map((item, index) => (
                    <div key={`${item.institution}-${index}`} className="rounded-2xl bg-[var(--background-secondary)] px-4 py-4 border border-[var(--border)]">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-semibold text-[var(--foreground)]">{getLocalizedEducationDegree(item, locale)}</h3>
                          <p className="text-sm text-[var(--primary-light)]">{getLocalizedEducationInstitution(item, locale)}</p>
                        </div>
                        <span className="text-xs text-[var(--foreground-secondary)]">{item.startDate} - {item.current ? (isAr ? 'حتى الآن' : 'Present') : item.endDate || '-'}</span>
                      </div>
                      <p className="text-sm text-[var(--foreground-secondary)]">{getLocalizedEducationField(item, locale)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </section>
        )}

        {similarTalents.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--foreground)]">{isAr ? 'كفاءات مشابهة' : 'Similar Talents'}</h2>
                <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                  {isAr ? 'ترشيحات مبنية على التخصص والمهارات والخبرة والموقع' : 'Recommendations ranked by specialization, skills, experience, and location'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {similarTalents.map((item, index) => (
                <motion.div key={item.uid} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Link href={`/talents/${item.uid}`}>
                    <Card className="h-full flex flex-col group">
                      <div className="flex items-center gap-3 mb-4">
                        {item.avatar ? (
                          <img src={item.avatar} alt={item.displayName || 'Talent avatar'} className="w-14 h-14 rounded-2xl object-cover border border-[var(--border)]" />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center text-[var(--primary-dark)] font-bold text-lg">
                            {item.displayName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[var(--foreground)] truncate">{item.displayName}</h3>
                          <p className="text-sm text-[var(--primary-light)] truncate">{item.specialization || (isAr ? 'مرشح' : 'Talent')}</p>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--foreground-secondary)] mb-4 line-clamp-3 flex-1">
                        {item.bio || (isAr ? 'مرشح متاح ببطاقة مختصرة ومهارات رئيسية للعرض السريع.' : 'Available profile with a compact card and key skills for quick browsing.')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(item.skills ?? []).slice(0, 3).map((skill) => (
                          <span key={skill} className="px-2.5 py-1 rounded-full text-xs bg-[var(--accent)]/10 text-[var(--accent)]">{skill}</span>
                        ))}
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
      <Footer />
    </main>
  );
}