'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FiMapPin, FiBriefcase, FiClock, FiDollarSign, FiPlus, FiX, FiSend } from 'react-icons/fi';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast, { Toaster } from 'react-hot-toast';
import { Job, JobApplication } from '@/types';
import Link from 'next/link';
import { getLocalizedJobDescription, getLocalizedJobTitle } from '@/lib/i18n-content';

interface JobApplicationDraft {
  jobId: string;
  applicantId: string;
  applicantName: string;
  message: string;
  status: 'pending';
}

async function fetchJobs() {
  const jobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(jobsQuery);
  return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Job));
}

function getTimeValue(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value && 'seconds' in value && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  return 0;
}

function sortJobsByRecent(items: Job[]) {
  return [...items].sort((left, right) => getTimeValue(right.createdAt) - getTimeValue(left.createdAt));
}

function sortApplicationsByRecent(items: JobApplication[]) {
  return [...items].sort((left, right) => getTimeValue(right.createdAt) - getTimeValue(left.createdAt));
}

export default function JobsPage() {
  const { locale, theme } = useAppStore();
  const { user } = useAuthStore();
  const isAr = locale === 'ar';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companyApplications, setCompanyApplications] = useState<JobApplication[]>([]);
  const [companyTab, setCompanyTab] = useState<'jobs' | 'applications'>('jobs');
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [postForm, setPostForm] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    country: '',
    city: '',
    type: 'full-time',
    salary: '',
    requirements: '',
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        if (user?.role === 'company') {
          const [companyJobsSnapshot, applicationsSnapshot] = await Promise.all([
            getDocs(query(collection(db, 'jobs'), where('companyId', '==', user.uid))),
            getDocs(query(collection(db, 'applications'), where('companyId', '==', user.uid))),
          ]);

          const companyJobs = sortJobsByRecent(companyJobsSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Job)));

          setJobs(companyJobs);
          setCompanyApplications(
            sortApplicationsByRecent(applicationsSnapshot.docs
              .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as JobApplication))
            ),
          );
        } else {
          setJobs(await fetchJobs());
          setCompanyApplications([]);
        }
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadJobs();
  }, [user]);

  const companyStats = user?.role === 'company'
    ? {
        totalJobs: jobs.length,
        activeJobs: jobs.filter((job) => job.status === 'active').length,
        pendingApplications: companyApplications.filter((application) => application.status === 'pending').length,
        acceptedApplications: companyApplications.filter((application) => application.status === 'accepted').length,
      }
    : null;

  const reloadCompanyData = async () => {
    if (!user || user.role !== 'company') {
      return;
    }

    const [companyJobsSnapshot, applicationsSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'jobs'), where('companyId', '==', user.uid))),
      getDocs(query(collection(db, 'applications'), where('companyId', '==', user.uid))),
    ]);

    const companyJobs = sortJobsByRecent(companyJobsSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Job)));

    setJobs(companyJobs);
    setCompanyApplications(
      sortApplicationsByRecent(applicationsSnapshot.docs
        .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as JobApplication))
      ),
    );
  };

  const updateApplicationStatus = async (application: JobApplication, status: 'accepted' | 'rejected') => {
    if (!user || user.role !== 'company') {
      return;
    }

    await updateDoc(doc(db, 'applications', application.id), {
      status,
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'notifications'), {
      userId: application.applicantId,
      type: 'system',
      title: status === 'accepted'
        ? (isAr ? 'تم قبول طلبك' : 'Application accepted')
        : (isAr ? 'تم رفض طلبك' : 'Application rejected'),
      message: status === 'accepted'
        ? (isAr ? `تم قبول طلبك المرسل إلى الوظيفة ${application.jobId}` : `Your application for job ${application.jobId} has been accepted`)
        : (isAr ? `تم رفض طلبك المرسل إلى الوظيفة ${application.jobId}` : `Your application for job ${application.jobId} has been rejected`),
      read: false,
      createdAt: serverTimestamp(),
      data: { jobId: application.jobId },
    });

    toast.success(status === 'accepted' ? (isAr ? 'تم قبول الطلب' : 'Application accepted') : (isAr ? 'تم رفض الطلب' : 'Application rejected'));
    await reloadCompanyData();
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'company') return;

    try {
      await addDoc(collection(db, 'jobs'), {
        ...postForm,
        requirements: postForm.requirements.split(',').map(r => r.trim()),
        companyId: user.uid,
        companyName: user.displayName,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      toast.success(isAr ? 'تم نشر الوظيفة' : 'Job posted successfully');
      setShowPostForm(false);
      setPostForm({ title: '', titleAr: '', description: '', descriptionAr: '', country: '', city: '', type: 'full-time', salary: '', requirements: '' });
      if (user.role === 'company') {
        await reloadCompanyData();
      } else {
        setJobs(await fetchJobs());
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleApply = async (jobId: string) => {
    if (!user || user.role !== 'individual') return;

    try {
      const job = jobs.find(j => j.id === jobId);
      const application: JobApplicationDraft = {
        jobId,
        applicantId: user.uid,
        applicantName: user.displayName,
        message: applyMessage,
        status: 'pending',
      };
      await addDoc(collection(db, 'applications'), {
        ...application,
        companyId: job?.companyId || '',
        createdAt: serverTimestamp(),
      });

      // Send notification to company
      if (job) {
        await addDoc(collection(db, 'notifications'), {
          userId: job.companyId,
          type: 'new_application',
          title: isAr ? 'طلب توظيف جديد' : 'New Job Application',
          message: isAr
            ? `${user.displayName} تقدم لوظيفة ${job.title}`
            : `${user.displayName} applied for ${job.title}`,
          read: false,
          createdAt: serverTimestamp(),
          data: { jobId, applicantId: user.uid },
        });
      }

      toast.success(isAr ? 'تم إرسال طلبك بنجاح' : 'Application sent successfully');
      setShowApplyModal(null);
      setApplyMessage('');
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'An error occurred');
    }
  };

  return (
    <main>
      <Navbar />
      <Toaster position="top-center" />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                {user?.role === 'company' ? (isAr ? 'إدارة وظائف الشركة' : 'Company Job Management') : (isAr ? 'الوظائف المتاحة' : 'Available Jobs')}
              </h1>
              <p className="text-[var(--foreground-secondary)] text-sm mt-1">
                {user?.role === 'company'
                  ? (isAr ? 'أدر الوظائف المنشورة وراجع طلبات المتقدمين من صفحة واحدة.' : 'Manage posted jobs and review applicant activity from one place.')
                  : (isAr ? 'تصفح الوظائف وتقدم مباشرة' : 'Browse jobs and apply directly')}
              </p>
            </div>
            {user?.role === 'company' && (
              <Button onClick={() => setShowPostForm(true)}>
                <FiPlus size={18} />
                {isAr ? 'نشر وظيفة' : 'Post a Job'}
              </Button>
            )}
          </div>

          {user?.role === 'company' && companyStats && (
            <>
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setCompanyTab('jobs')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${companyTab === 'jobs' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border)]'}`}
                >
                  {isAr ? 'وظائفي' : 'My Jobs'}
                </button>
                <button
                  onClick={() => setCompanyTab('applications')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${companyTab === 'applications' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border)]'}`}
                >
                  {isAr ? 'طلبات التقديم' : 'Applications'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                <p className="text-sm text-[var(--foreground-secondary)] mb-1">{isAr ? 'إجمالي الوظائف' : 'Total Jobs'}</p>
                <p className="text-2xl font-semibold text-[var(--foreground)]">{companyStats.totalJobs}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                <p className="text-sm text-[var(--foreground-secondary)] mb-1">{isAr ? 'الوظائف النشطة' : 'Active Jobs'}</p>
                <p className="text-2xl font-semibold text-[var(--foreground)]">{companyStats.activeJobs}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                <p className="text-sm text-[var(--foreground-secondary)] mb-1">{isAr ? 'طلبات معلقة' : 'Pending Applications'}</p>
                <p className="text-2xl font-semibold text-[var(--foreground)]">{companyStats.pendingApplications}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
                <p className="text-sm text-[var(--foreground-secondary)] mb-1">{isAr ? 'طلبات مقبولة' : 'Accepted Applications'}</p>
                <p className="text-2xl font-semibold text-[var(--foreground)]">{companyStats.acceptedApplications}</p>
              </div>
              </div>
            </>
          )}

          {user?.role === 'company' && companyTab === 'applications' && (
            <Card hover={false} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{isAr ? 'آخر طلبات التقديم' : 'Recent Applications'}</h3>
                <span className="text-sm text-[var(--foreground-secondary)]">{companyApplications.length} {isAr ? 'طلب' : 'applications'}</span>
              </div>
              <div className="space-y-3">
                {companyApplications.length > 0 ? companyApplications.slice(0, 6).map((application) => (
                  <div key={application.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{application.applicantName}</p>
                      <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? `على الوظيفة: ${application.jobId}` : `For job: ${application.jobId}`}</p>
                      {application.message && <p className="text-sm text-[var(--foreground-secondary)] mt-1 line-clamp-2">{application.message}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${application.status === 'accepted' ? 'bg-green-100 text-green-700' : application.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {application.status}
                      </span>
                      {application.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => void updateApplicationStatus(application, 'accepted')}>{isAr ? 'قبول' : 'Accept'}</Button>
                          <Button variant="secondary" size="sm" onClick={() => void updateApplicationStatus(application, 'rejected')}>{isAr ? 'رفض' : 'Reject'}</Button>
                        </>
                      )}
                      <Link href={`/jobs/${application.jobId}`}><Button variant="secondary" size="sm">{isAr ? 'فتح الوظيفة' : 'Open Job'}</Button></Link>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد طلبات تقديم على وظائف شركتك حتى الآن.' : 'No applications on your company jobs yet.'}</p>
                )}
              </div>
            </Card>
          )}

          {/* Post Job Form */}
          <AnimatePresence>
            {showPostForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <Card hover={false}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                      {isAr ? 'نشر وظيفة جديدة' : 'Post a New Job'}
                    </h3>
                    <button onClick={() => setShowPostForm(false)} className="text-[var(--foreground-secondary)]">
                      <FiX size={20} />
                    </button>
                  </div>
                  <form onSubmit={handlePostJob} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Job Title (English)"
                        value={postForm.title}
                        onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                        placeholder={isAr ? 'مثال: مطور ويب' : 'e.g. Web Developer'}
                        required
                      />
                      <Input
                        label={isAr ? 'عنوان الوظيفة بالعربي (اختياري)' : 'Job Title (Arabic, optional)'}
                        value={postForm.titleAr}
                        onChange={(e) => setPostForm({ ...postForm, titleAr: e.target.value })}
                        dir="rtl"
                      />
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">
                          {isAr ? 'نوع العمل' : 'Job Type'}
                        </label>
                        <select
                          value={postForm.type}
                          onChange={(e) => setPostForm({ ...postForm, type: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]"
                        >
                          <option value="full-time">{isAr ? 'دوام كامل' : 'Full-time'}</option>
                          <option value="part-time">{isAr ? 'دوام جزئي' : 'Part-time'}</option>
                          <option value="remote">{isAr ? 'عن بعد' : 'Remote'}</option>
                          <option value="contract">{isAr ? 'عقد' : 'Contract'}</option>
                          <option value="freelance">{isAr ? 'فريلانس' : 'Freelance'}</option>
                        </select>
                      </div>
                      <Input
                        label={isAr ? 'الدولة' : 'Country'}
                        value={postForm.country}
                        onChange={(e) => setPostForm({ ...postForm, country: e.target.value })}
                        required
                      />
                      <Input
                        label={isAr ? 'المدينة' : 'City'}
                        value={postForm.city}
                        onChange={(e) => setPostForm({ ...postForm, city: e.target.value })}
                      />
                      <Input
                        label={isAr ? 'الراتب (اختياري)' : 'Salary (optional)'}
                        value={postForm.salary}
                        onChange={(e) => setPostForm({ ...postForm, salary: e.target.value })}
                        placeholder={isAr ? 'مثال: 1000-2000$' : 'e.g. $1000-$2000'}
                      />
                      <Input
                        label={isAr ? 'المتطلبات (مفصولة بفاصلة)' : 'Requirements (comma separated)'}
                        value={postForm.requirements}
                        onChange={(e) => setPostForm({ ...postForm, requirements: e.target.value })}
                        placeholder={isAr ? 'React, Node.js, 3 سنوات خبرة' : 'React, Node.js, 3 years exp'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">
                        Job Description (English)
                      </label>
                      <textarea
                        value={postForm.description}
                        onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">
                        {isAr ? 'وصف الوظيفة بالعربي (اختياري)' : 'Job Description (Arabic, optional)'}
                      </label>
                      <textarea
                        value={postForm.descriptionAr}
                        onChange={(e) => setPostForm({ ...postForm, descriptionAr: e.target.value })}
                        rows={4}
                        dir="rtl"
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none"
                      />
                    </div>
                    <Button type="submit" fullWidth>
                      {isAr ? 'نشر الوظيفة' : 'Post Job'}
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Jobs List */}
          {companyTab === 'applications' && user?.role === 'company' ? null : loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 rounded-2xl bg-[var(--background-secondary)] animate-pulse" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-[var(--foreground-secondary)]">
              <FiBriefcase size={48} className="mx-auto mb-4 opacity-50" />
              <p>{user?.role === 'company' ? (isAr ? 'لا توجد وظائف منشورة لشركتك حتى الآن' : 'Your company has not posted any jobs yet') : (isAr ? 'لا توجد وظائف متاحة حالياً' : 'No jobs available yet')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <Link href={`/jobs/${job.id}`} className="flex-1 block group">
                        <div className="flex items-center gap-3 mb-2">
                          {job.companyAvatar ? (
                            <img
                              src={job.companyAvatar}
                              alt={job.companyName || 'Company logo'}
                              className="w-10 h-10 rounded-xl object-cover border border-[var(--border)] bg-[var(--background-secondary)]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-bold text-sm">
                              {job.companyName?.charAt(0) || 'C'}
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary-light)] transition-colors">{getLocalizedJobTitle(job, locale)}</h3>
                            <p className="text-sm text-[var(--foreground-secondary)]">{job.companyName}</p>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--foreground-secondary)] mb-3 line-clamp-2">
                          {getLocalizedJobDescription(job, locale)}
                        </p>
                        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                          {job.country && (
                            <span className="flex items-center gap-1">
                              <FiMapPin size={14} /> {job.country}{job.city ? `, ${job.city}` : ''}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FiClock size={14} />
                            {job.type === 'full-time' ? (isAr ? 'دوام كامل' : 'Full-time') :
                             job.type === 'part-time' ? (isAr ? 'دوام جزئي' : 'Part-time') :
                             job.type === 'remote' ? (isAr ? 'عن بعد' : 'Remote') :
                             job.type === 'freelance' ? (isAr ? 'فريلانس' : 'Freelance') :
                             (isAr ? 'عقد' : 'Contract')}
                          </span>
                          {job.salary && (
                            <span className="flex items-center gap-1">
                              <FiDollarSign size={14} /> {job.salary}
                            </span>
                          )}
                        </div>
                        {job.requirements?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {job.requirements.slice(0, 4).map((req: string, j: number) => (
                              <span key={j} className="px-2 py-0.5 rounded-full text-xs bg-[var(--primary-light)]/10 text-[var(--primary-light)]">
                                {req}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-4 inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors group-hover:border-[var(--primary-light)] group-hover:text-[var(--primary-light)]">
                          {isAr ? 'عرض كرت الوظيفة' : 'Open Job Card'}
                        </div>
                      </Link>
                      <div>
                        {user?.role === 'individual' && (
                          <Button onClick={() => setShowApplyModal(job.id)} size="sm">
                            <FiSend size={14} />
                            {isAr ? 'تقديم' : 'Apply'}
                          </Button>
                        )}
                        {user?.role === 'company' && user.uid === job.companyId && (
                          <Link href={`/jobs/${job.id}`}><Button variant="secondary" size="sm">{isAr ? 'إدارة' : 'Manage'}</Button></Link>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowApplyModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                {isAr ? 'تقديم على الوظيفة' : 'Apply for this Job'}
              </h3>
              <textarea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={4}
                placeholder={isAr ? 'اكتب رسالة للشركة (اختياري)...' : 'Write a message to the company (optional)...'}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none mb-4"
              />
              <p className="text-xs text-[var(--foreground-secondary)] mb-4">
                {isAr ? '* سيتم إرسال ملفك الشخصي مع الطلب' : '* Your profile will be sent with the application'}
              </p>
              <div className="flex gap-3">
                <Button onClick={() => handleApply(showApplyModal)} fullWidth>
                  {isAr ? 'إرسال الطلب' : 'Send Application'}
                </Button>
                <Button variant="secondary" onClick={() => setShowApplyModal(null)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
