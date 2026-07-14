'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/lib/firebase';
import { Conversation, CVRequest, Job, JobApplication, Notification } from '@/types';
import { FiArrowRight, FiBell, FiBriefcase, FiCheckCircle, FiClock, FiFileText, FiMessageSquare, FiSearch, FiUser } from 'react-icons/fi';

function getTimeValue(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value && 'seconds' in value && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  return 0;
}

function sortByRecent<T extends { createdAt?: unknown; lastMessageAt?: unknown }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftTime = getTimeValue(left.lastMessageAt ?? left.createdAt);
    const rightTime = getTimeValue(right.lastMessageAt ?? right.createdAt);
    return rightTime - leftTime;
  });
}

function sortJobsByRecent(items: Job[]) {
  return [...items].sort((left, right) => getTimeValue(right.createdAt) - getTimeValue(left.createdAt));
}

function getProfileReadiness(user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>, isAr: boolean) {
  const checks = user.role === 'company'
    ? [
        { ok: Boolean(user.avatar), label: isAr ? 'شعار أو صورة للشركة' : 'Company image or logo' },
        { ok: Boolean(user.description), label: isAr ? 'وصف الشركة' : 'Company description' },
        { ok: Boolean(user.industry), label: isAr ? 'المجال' : 'Industry' },
        { ok: Boolean(user.website), label: isAr ? 'الموقع الإلكتروني' : 'Website' },
        { ok: Boolean(user.country), label: isAr ? 'الدولة' : 'Country' },
        { ok: Boolean(user.city), label: isAr ? 'المدينة' : 'City' },
        { ok: Boolean(user.services?.length), label: isAr ? 'الخدمات' : 'Services' },
        { ok: Boolean(user.projects?.length), label: isAr ? 'المشاريع السابقة' : 'Past projects' },
      ]
    : [
        { ok: Boolean(user.avatar), label: isAr ? 'الصورة الشخصية' : 'Profile photo' },
        { ok: Boolean(user.specialization), label: isAr ? 'التخصص' : 'Specialization' },
        { ok: Boolean(user.experienceYears || user.experienceYears === 0), label: isAr ? 'سنوات الخبرة' : 'Years of experience' },
        { ok: Boolean(user.bio), label: isAr ? 'النبذة الشخصية' : 'Professional bio' },
        { ok: Boolean(user.country), label: isAr ? 'الدولة' : 'Country' },
        { ok: Boolean(user.city), label: isAr ? 'المدينة' : 'City' },
        { ok: Boolean(user.skills?.length), label: isAr ? 'المهارات' : 'Skills' },
        { ok: Boolean(user.cvFile), label: isAr ? 'السيرة الذاتية' : 'CV upload' },
      ];

  const completed = checks.filter((check) => check.ok).length;
  return {
    score: Math.round((completed / checks.length) * 100),
    missing: checks.filter((check) => !check.ok).map((check) => check.label),
  };
}

export default function DashboardPage() {
  const { locale, theme } = useAppStore();
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const isAr = locale === 'ar';
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [cvRequests, setCvRequests] = useState<CVRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  }, [isAr, theme]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const loadDashboard = async () => {
      try {
        const conversationsPromise = getDocs(query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid)));
        const notificationsPromise = getDocs(query(collection(db, 'notifications'), where('userId', '==', user.uid)));

        if (user.role === 'company') {
          const [jobsSnapshot, requestsSnapshot, conversationsSnapshot, notificationsSnapshot, applicationsSnapshot] = await Promise.all([
            getDocs(query(collection(db, 'jobs'), where('companyId', '==', user.uid))),
            getDocs(query(collection(db, 'cvRequests'), where('companyId', '==', user.uid))),
            conversationsPromise,
            notificationsPromise,
            getDocs(query(collection(db, 'applications'), where('companyId', '==', user.uid))),
          ]);

          const postedJobs = sortJobsByRecent(jobsSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Job)));

          setJobs(postedJobs);
          setApplications(applicationsSnapshot.docs
            .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as JobApplication)));
          setCvRequests(requestsSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as CVRequest)));
          setConversations(conversationsSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Conversation)));
          setNotifications(notificationsSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Notification)));
        } else {
          const [applicationsSnapshot, requestsSnapshot, conversationsSnapshot, notificationsSnapshot] = await Promise.all([
            getDocs(query(collection(db, 'applications'), where('applicantId', '==', user.uid))),
            getDocs(query(collection(db, 'cvRequests'), where('individualId', '==', user.uid))),
            conversationsPromise,
            notificationsPromise,
          ]);

          setApplications(applicationsSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as JobApplication)));
          setCvRequests(requestsSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as CVRequest)));
          setConversations(conversationsSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Conversation)));
          setNotifications(notificationsSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Notification)));
        }
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [authLoading, isAr, router, user]);

  const recentNotifications = useMemo(() => sortByRecent(notifications).slice(0, 4), [notifications]);
  const recentConversations = useMemo(() => sortByRecent(conversations).slice(0, 4), [conversations]);
  const recentJobs = useMemo(() => sortByRecent(jobs).slice(0, 4), [jobs]);
  const recentApplications = useMemo(() => sortByRecent(applications).slice(0, 4), [applications]);
  const recentCvRequests = useMemo(() => sortByRecent(cvRequests).slice(0, 4), [cvRequests]);
  const pendingCvRequests = useMemo(() => cvRequests.filter((request) => request.status === 'pending'), [cvRequests]);
  const unreadNotificationsCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
  const approvedCvRequestsCount = useMemo(() => cvRequests.filter((request) => request.status === 'approved').length, [cvRequests]);
  const readiness = useMemo(
    () => (user ? getProfileReadiness(user, isAr) : { score: 0, missing: [] as string[] }),
    [isAr, user],
  );

  if (authLoading || !user) return null;

  const quickActions = user.role === 'company'
    ? [
        { href: '/jobs', label: isAr ? 'نشر أو إدارة الوظائف' : 'Post or manage jobs', description: isAr ? 'افتح الوظائف الحالية أو أضف فرصة جديدة.' : 'Open current jobs or add a new opportunity.' },
        { href: '/notifications', label: isAr ? 'متابعة الطلبات' : 'Review incoming requests', description: isAr ? 'راجع التنبيهات والطلبات غير المقروءة.' : 'Review unread alerts and incoming requests.' },
        { href: '/chat', label: isAr ? 'متابعة المحادثات' : 'Reply to conversations', description: isAr ? 'ارجع لأحدث المحادثات مع المرشحين.' : 'Jump back into the latest candidate conversations.' },
      ]
    : [
        { href: '/search', label: isAr ? 'البحث عن فرص' : 'Search opportunities', description: isAr ? 'استكشف وظائف وشركات مناسبة لملفك.' : 'Browse jobs and companies that match your profile.' },
        { href: '/profile', label: isAr ? 'إكمال ملفك' : 'Complete your profile', description: isAr ? 'أغلق العناصر الناقصة لرفع فرص ظهورك.' : 'Close missing profile items to improve visibility.' },
        { href: '/chat', label: isAr ? 'متابعة الرسائل' : 'Continue conversations', description: isAr ? 'ارجع للمحادثات النشطة مع الشركات.' : 'Return to active conversations with companies.' },
      ];

  const heroTitle = user.role === 'company'
    ? (isAr ? 'لوحة الشركة' : 'Company Dashboard')
    : (isAr ? 'لوحة المتقدم' : 'Talent Dashboard');

  const stats = user.role === 'company'
    ? [
        { label: isAr ? 'الوظائف المنشورة' : 'Posted Jobs', value: jobs.length, icon: FiBriefcase },
        { label: isAr ? 'طلبات التقديم' : 'Applications', value: applications.length, icon: FiFileText },
        { label: isAr ? 'طلبات السيرة' : 'CV Requests', value: cvRequests.length, icon: FiMessageSquare },
        { label: isAr ? 'الإشعارات غير المقروءة' : 'Unread Notifications', value: unreadNotificationsCount, icon: FiBell },
      ]
    : [
        { label: isAr ? 'طلبات التوظيف' : 'Applications', value: applications.length, icon: FiBriefcase },
        { label: isAr ? 'طلبات السيرة الموافق عليها' : 'Approved CV Requests', value: approvedCvRequestsCount, icon: FiCheckCircle },
        { label: isAr ? 'المحادثات' : 'Conversations', value: conversations.length, icon: FiMessageSquare },
        { label: isAr ? 'الإشعارات غير المقروءة' : 'Unread Notifications', value: unreadNotificationsCount, icon: FiBell },
      ];

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <section className="rounded-[2rem] border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--accent)]/10 p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <span className="inline-flex items-center rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-medium text-[var(--primary-light)] mb-3">
                  {isAr ? 'جاهز للعمل اليومي' : 'Ready for daily use'}
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-2">{heroTitle}</h1>
                <p className="text-[var(--foreground-secondary)] max-w-3xl">
                  {user.role === 'company'
                    ? (isAr ? 'تابع الوظائف والطلبات والمحادثات والإشعارات من مكان واحد بدل التنقل بين الصفحات.' : 'Track jobs, requests, conversations, and notifications from one place instead of jumping between pages.')
                    : (isAr ? 'تابع طلباتك ومحادثاتك والإشعارات وحالة ملفك من صفحة واحدة واضحة.' : 'Track your applications, conversations, notifications, and profile status from a single clear page.')}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/profile"><Button variant="secondary"><FiUser size={16} />{isAr ? 'الملف الشخصي' : 'Profile'}</Button></Link>
                <Link href="/notifications"><Button variant="secondary"><FiBell size={16} />{isAr ? 'الإشعارات' : 'Notifications'}</Button></Link>
                <Link href="/chat"><Button variant="secondary"><FiMessageSquare size={16} />{isAr ? 'المحادثات' : 'Chat'}</Button></Link>
                <Link href={user.role === 'company' ? '/jobs' : '/search'}><Button><FiSearch size={16} />{user.role === 'company' ? (isAr ? 'إدارة الوظائف' : 'Manage Jobs') : (isAr ? 'استكشاف الفرص' : 'Explore Opportunities')}</Button></Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                    <div className="flex items-center gap-2 text-[var(--foreground-secondary)] text-sm mb-2">
                      <Icon size={16} /> {item.label}
                    </div>
                    <p className="text-2xl font-semibold text-[var(--foreground)]">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card hover={false} className="xl:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</h2>
                <span className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'اختصارات عملية لليوم' : 'Practical shortcuts for today'}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href} className="group rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4 hover:border-[var(--primary-light)] transition-colors">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-[var(--foreground)]">{action.label}</h3>
                      <FiArrowRight size={16} className="text-[var(--primary-light)] transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="text-sm text-[var(--foreground-secondary)]">{action.description}</p>
                  </Link>
                ))}
              </div>
            </Card>

            <Card hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">{isAr ? 'جاهزية الملف' : 'Profile Readiness'}</h2>
                <span className="text-sm font-semibold text-[var(--primary-light)]">{readiness.score}%</span>
              </div>
              <div className="h-3 rounded-full bg-[var(--background-secondary)] overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${readiness.score}%` }} />
              </div>
              {readiness.missing.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'العناصر الناقصة:' : 'Missing items:'}</p>
                  {readiness.missing.slice(0, 4).map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                      <FiClock size={14} className="text-[var(--accent)]" />
                      <span>{item}</span>
                    </div>
                  ))}
                  <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors mt-2">
                    {isAr ? 'إكمال الملف الآن' : 'Complete profile now'}
                    <FiArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                  <FiCheckCircle size={16} className="text-[var(--accent)]" />
                  <span>{isAr ? 'ملفك مكتمل بشكل ممتاز.' : 'Your profile is in strong shape.'}</span>
                </div>
              )}
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card hover={false} className="xl:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">{user.role === 'company' ? (isAr ? 'آخر العناصر التشغيلية' : 'Latest Operational Items') : (isAr ? 'آخر طلباتك' : 'Your Recent Activity')}</h2>
                <Link href={user.role === 'company' ? '/jobs' : '/search'} className="text-sm font-medium text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">{isAr ? 'عرض الكل' : 'View all'}</Link>
              </div>
              <div className="space-y-4">
                {loading ? [1, 2, 3].map((item) => <div key={item} className="h-24 rounded-2xl bg-[var(--background-secondary)] animate-pulse" />) : null}
                {!loading && (user.role === 'company' ? recentJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-4 hover:border-[var(--primary-light)] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)]">{job.title}</h3>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1 line-clamp-2">{job.description}</p>
                      </div>
                      <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]">{job.status}</span>
                    </div>
                  </Link>
                )) : recentApplications.map((application) => (
                  <Link key={application.id} href={`/jobs/${application.jobId}`} className="block rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-4 hover:border-[var(--primary-light)] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)]">{isAr ? 'طلب توظيف' : 'Job Application'}</h3>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1">{isAr ? `رقم الوظيفة: ${application.jobId}` : `Job ID: ${application.jobId}`}</p>
                      </div>
                      <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-medium text-[var(--primary-light)]">{application.status}</span>
                    </div>
                  </Link>
                ))) }

                {!loading && user.role === 'company' && recentJobs.length === 0 && (
                  <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد وظائف منشورة بعد.' : 'No jobs posted yet.'}</p>
                )}
                {!loading && user.role !== 'company' && recentApplications.length === 0 && (
                  <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد طلبات توظيف بعد.' : 'No applications yet.'}</p>
                )}
              </div>
            </Card>

            <Card hover={false}>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">{isAr ? 'حالة الطلبات' : 'Request Status'}</h2>
              <div className="space-y-3">
                <div className="rounded-2xl bg-[var(--background-secondary)] px-4 py-4">
                  <p className="text-sm text-[var(--foreground-secondary)] mb-1">{isAr ? 'الطلبات المعلقة' : 'Pending Requests'}</p>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">{pendingCvRequests.length}</p>
                </div>
                <div className="rounded-2xl bg-[var(--background-secondary)] px-4 py-4">
                  <p className="text-sm text-[var(--foreground-secondary)] mb-1">{user.role === 'company' ? (isAr ? 'طلبات التقديم الجديدة' : 'New applications') : (isAr ? 'طلبات السيرة الموافق عليها' : 'Approved CV requests')}</p>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">{user.role === 'company' ? applications.filter((item) => item.status === 'pending').length : approvedCvRequestsCount}</p>
                </div>
                <div className="rounded-2xl bg-[var(--background-secondary)] px-4 py-4">
                  <p className="text-sm text-[var(--foreground-secondary)] mb-1">{isAr ? 'المحادثات المفتوحة' : 'Open Conversations'}</p>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">{conversations.length}</p>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">{user.role === 'company' ? (isAr ? 'آخر طلبات التوظيف' : 'Recent Applications') : (isAr ? 'آخر طلبات السيرة' : 'Recent CV Requests')}</h2>
                <Link href={user.role === 'company' ? '/jobs' : '/notifications'} className="text-sm font-medium text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">{isAr ? 'عرض الكل' : 'View all'}</Link>
              </div>
              <div className="space-y-3">
                {user.role === 'company' ? recentApplications.map((application) => (
                  <div key={application.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)]">{application.applicantName}</h3>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1">{isAr ? `على الوظيفة: ${application.jobId}` : `For job: ${application.jobId}`}</p>
                      </div>
                      <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-medium text-[var(--primary-light)]">{application.status}</span>
                    </div>
                  </div>
                )) : recentCvRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)]">{isAr ? 'طلب سيرة ذاتية' : 'CV Request'}</h3>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1">{isAr ? `الشركة: ${request.companyId}` : `Company: ${request.companyId}`}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${request.status === 'approved' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : request.status === 'rejected' ? 'bg-[var(--error)]/10 text-[var(--error)]' : 'bg-[var(--primary)]/10 text-[var(--primary-light)]'}`}>{request.status}</span>
                    </div>
                  </div>
                ))}
                {user.role === 'company' && !loading && recentApplications.length === 0 && <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد طلبات توظيف حديثة.' : 'No recent applications.'}</p>}
                {user.role !== 'company' && !loading && recentCvRequests.length === 0 && <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد طلبات سيرة حديثة.' : 'No recent CV requests.'}</p>}
              </div>
            </Card>

            <Card hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">{isAr ? 'أولويات اليوم' : 'Today Priorities'}</h2>
                <Link href="/notifications" className="text-sm font-medium text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">{isAr ? 'فتح الإشعارات' : 'Open notifications'}</Link>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-[var(--background-secondary)] px-4 py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{isAr ? 'إشعارات غير مقروءة' : 'Unread notifications'}</p>
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1">{isAr ? 'راجع الرسائل والتنبيهات الجديدة أولاً.' : 'Review fresh alerts and messages first.'}</p>
                  </div>
                  <span className="text-2xl font-semibold text-[var(--foreground)]">{unreadNotificationsCount}</span>
                </div>
                <div className="rounded-2xl bg-[var(--background-secondary)] px-4 py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{isAr ? 'طلبات تحتاج متابعة' : 'Requests needing follow-up'}</p>
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1">{isAr ? 'ابدأ بالطلبات المعلقة أو غير المحسومة.' : 'Start with pending or unresolved requests.'}</p>
                  </div>
                  <span className="text-2xl font-semibold text-[var(--foreground)]">{pendingCvRequests.length}</span>
                </div>
                <div className="rounded-2xl bg-[var(--background-secondary)] px-4 py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{isAr ? 'جاهزية الملف' : 'Profile readiness'}</p>
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1">{isAr ? 'كلما زادت الجاهزية زادت قيمة الظهور والثقة.' : 'Higher readiness improves visibility and trust.'}</p>
                  </div>
                  <span className="text-2xl font-semibold text-[var(--foreground)]">{readiness.score}%</span>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">{isAr ? 'آخر الإشعارات' : 'Recent Notifications'}</h2>
                <Link href="/notifications" className="text-sm font-medium text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">{isAr ? 'كل الإشعارات' : 'All notifications'}</Link>
              </div>
              <div className="space-y-3">
                {recentNotifications.length > 0 ? recentNotifications.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)]">{item.title}</h3>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1">{item.message}</p>
                      </div>
                      {!item.read && <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary-light)] mt-2" />}
                    </div>
                  </div>
                )) : <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد إشعارات حديثة.' : 'No recent notifications.'}</p>}
              </div>
            </Card>

            <Card hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">{isAr ? 'آخر المحادثات' : 'Recent Conversations'}</h2>
                <Link href="/chat" className="text-sm font-medium text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">{isAr ? 'فتح الشات' : 'Open chat'}</Link>
              </div>
              <div className="space-y-3">
                {recentConversations.length > 0 ? recentConversations.map((item) => (
                  <Link key={item.id} href={`/chat?conversation=${item.id}`} className="block rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-4 hover:border-[var(--primary-light)] transition-colors">
                    <h3 className="font-semibold text-[var(--foreground)]">{item.participantNames?.find((name) => name !== user.displayName) || item.participantNames?.[0] || (isAr ? 'محادثة' : 'Conversation')}</h3>
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1 line-clamp-2">{item.lastMessage || (isAr ? 'لا توجد رسالة أخيرة حتى الآن' : 'No last message yet')}</p>
                  </Link>
                )) : <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد محادثات حديثة.' : 'No recent conversations.'}</p>}
              </div>
            </Card>
          </section>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}