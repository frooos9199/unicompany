'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/lib/firebase';
import { AppUser, Job } from '@/types';
import { findOrCreateConversation } from '@/lib/chat';
import { FiBriefcase, FiClock, FiDollarSign, FiFileText, FiMapPin, FiMessageSquare } from 'react-icons/fi';
import { getLocalizedJobDescription, getLocalizedJobTitle } from '@/lib/i18n-content';

function normalizeTokens(...values: Array<string | undefined>) {
  return new Set(
    values
      .flatMap((value) => (value || '').toLowerCase().split(/[^\p{L}\p{N}]+/u))
      .map((token) => token.trim())
      .filter((token) => token.length > 2),
  );
}

function scoreJobSimilarity(baseJob: Job, candidate: Job) {
  let score = 0;

  if (baseJob.companyId === candidate.companyId) {
    score += 3;
  }

  if (baseJob.type === candidate.type) {
    score += 2;
  }

  if (baseJob.country === candidate.country) {
    score += 1;
  }

  const baseRequirements = new Set(baseJob.requirements ?? []);
  const sharedRequirements = (candidate.requirements ?? []).filter((req) => baseRequirements.has(req)).length;
  score += sharedRequirements * 2;

  const baseTokens = normalizeTokens(baseJob.title, baseJob.description, ...(baseJob.requirements ?? []));
  const candidateTokens = normalizeTokens(candidate.title, candidate.description, ...(candidate.requirements ?? []));
  let textOverlap = 0;
  candidateTokens.forEach((token) => {
    if (baseTokens.has(token)) {
      textOverlap += 1;
    }
  });
  score += Math.min(textOverlap, 4);

  return score;
}

function typeLabel(type: Job['type'], isAr: boolean) {
  if (type === 'full-time') return isAr ? 'دوام كامل' : 'Full-time';
  if (type === 'part-time') return isAr ? 'دوام جزئي' : 'Part-time';
  if (type === 'remote') return isAr ? 'عن بعد' : 'Remote';
  if (type === 'freelance') return isAr ? 'فريلانس' : 'Freelance';
  return isAr ? 'عقد' : 'Contract';
}

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { locale, theme } = useAppStore();
  const { user } = useAuthStore();
  const isAr = locale === 'ar';
  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<AppUser | null>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const jobSnapshot = await getDoc(doc(db, 'jobs', params.id));
        if (!jobSnapshot.exists()) {
          return;
        }

        const activeJob = { id: jobSnapshot.id, ...jobSnapshot.data() } as Job;
        setJob(activeJob);

        const [companySnapshot, jobsSnapshot] = await Promise.all([
          getDoc(doc(db, 'users', activeJob.companyId)),
          getDocs(query(collection(db, 'jobs'), where('status', '==', 'active'), limit(14))),
        ]);

        if (companySnapshot.exists()) {
          setCompany({ uid: companySnapshot.id, ...companySnapshot.data() } as AppUser);
        }

        const related = jobsSnapshot.docs
          .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Job))
          .filter((item) => item.id !== activeJob.id)
          .map((item) => ({ item, score: scoreJobSimilarity(activeJob, item) }))
          .filter(({ score }) => score > 0)
          .sort((left, right) => right.score - left.score)
          .map(({ item }) => item)
          .slice(0, 4);

        setSimilarJobs(related);
      } finally {
        setLoading(false);
      }
    };

    void loadJob();
  }, [params.id]);

  const canApply = user?.role === 'individual';
  const canContact = user && company && user.uid !== company.uid && user.role === 'individual';

  const applyPayload = useMemo(() => ({
    applicantId: user?.uid || '',
    applicantName: user?.displayName || '',
  }), [user]);

  const handleApply = async () => {
    if (!job || !user || user.role !== 'individual') {
      if (!user) router.push('/auth/login');
      return;
    }

    try {
      await addDoc(collection(db, 'applications'), {
        jobId: job.id,
        companyId: job.companyId,
        ...applyPayload,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'notifications'), {
        userId: job.companyId,
        type: 'new_application',
        title: isAr ? 'طلب توظيف جديد' : 'New Job Application',
        message: isAr ? `${user.displayName} تقدم لوظيفة ${getLocalizedJobTitle(job, locale)}` : `${user.displayName} applied for ${getLocalizedJobTitle(job, locale)}`,
        read: false,
        createdAt: serverTimestamp(),
        data: { jobId: job.id, applicantId: user.uid },
      });

      toast.success(isAr ? 'تم إرسال الطلب' : 'Application sent');
    } catch {
      toast.error(isAr ? 'تعذر إرسال الطلب' : 'Could not send application');
    }
  };

  const handleDirectContact = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!company) return;

    try {
      const conversationId = await findOrCreateConversation(user, company);
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

  if (!job) {
    return (
      <main>
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center text-[var(--foreground-secondary)]">
          {isAr ? 'الوظيفة غير موجودة' : 'Job not found'}
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <Toaster position="top-center" />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card hover={false} className="overflow-hidden">
            <div className="rounded-3xl bg-gradient-to-br from-[var(--primary)]/15 via-transparent to-[var(--accent)]/10 p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex items-start gap-4 sm:gap-5">
                  {job.companyAvatar ? (
                    <img src={job.companyAvatar} alt={job.companyName} className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border border-[var(--border)] bg-[var(--background-secondary)]" />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white text-3xl font-bold">
                      {job.companyName?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div>
                    <span className="inline-flex items-center rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-medium text-[var(--primary-light)] mb-3">
                      {isAr ? 'كرت وظيفة' : 'Job Card'}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">{getLocalizedJobTitle(job, locale)}</h1>
                    <Link href={`/companies/${job.companyId}`} className="text-[var(--primary-light)] mt-1 inline-block hover:text-[var(--primary)] transition-colors">
                      {job.companyName}
                    </Link>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--foreground-secondary)]">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-secondary)] px-3 py-1.5">
                        <FiMapPin size={14} /> {job.country}{job.city ? `, ${job.city}` : ''}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-secondary)] px-3 py-1.5">
                        <FiClock size={14} /> {typeLabel(job.type, isAr)}
                      </span>
                      {job.salary && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-secondary)] px-3 py-1.5">
                          <FiDollarSign size={14} /> {job.salary}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-[260px]">
                  {canApply && (
                    <Button fullWidth onClick={handleApply}>
                      <FiFileText size={16} />
                      {isAr ? 'التقديم الآن' : 'Apply Now'}
                    </Button>
                  )}
                  {canContact && (
                    <Button fullWidth variant="secondary" onClick={handleDirectContact}>
                      <FiMessageSquare size={16} />
                      {isAr ? 'تواصل مع الشركة' : 'Contact Company'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 mt-8">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">{isAr ? 'وصف الوظيفة' : 'Job Description'}</h2>
                  <p className="text-[var(--foreground-secondary)] leading-7">{getLocalizedJobDescription(job, locale)}</p>
                </div>
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">{isAr ? 'المتطلبات الرئيسية' : 'Core Requirements'}</h2>
                  <div className="flex flex-wrap gap-2">
                    {(job.requirements ?? []).length > 0 ? job.requirements.map((requirement) => (
                      <span key={requirement} className="px-3 py-1.5 rounded-full text-sm bg-[var(--accent)]/10 text-[var(--accent)]">
                        {requirement}
                      </span>
                    )) : (
                      <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد متطلبات مسجلة' : 'No requirements listed'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {similarJobs.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">{isAr ? 'وظائف مشابهة' : 'Similar Jobs'}</h2>
              <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                {isAr ? 'ترشيحات مبنية على المسمى والوصف والمتطلبات ونوع العمل' : 'Recommendations ranked by title, description, requirements, and job type'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {similarJobs.map((item, index) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Link href={`/jobs/${item.id}`}>
                    <Card className="h-full flex flex-col group">
                      <div className="flex items-start gap-3 mb-3">
                        {item.companyAvatar ? (
                          <img src={item.companyAvatar} alt={item.companyName} className="w-12 h-12 rounded-2xl object-cover border border-[var(--border)]" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-bold text-sm">
                            {item.companyName?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[var(--foreground)] truncate">{getLocalizedJobTitle(item, locale)}</h3>
                          <p className="text-sm text-[var(--foreground-secondary)] truncate">{item.companyName}</p>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--foreground-secondary)] line-clamp-3 flex-1">{getLocalizedJobDescription(item, locale)}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--background-secondary)] text-[var(--foreground-secondary)]">{typeLabel(item.type, isAr)}</span>
                        {(item.requirements ?? []).slice(0, 2).map((requirement) => (
                          <span key={requirement} className="px-2.5 py-1 rounded-full text-xs bg-[var(--accent)]/10 text-[var(--accent)]">{requirement}</span>
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