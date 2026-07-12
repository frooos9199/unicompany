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
import { collection, query, getDocs, addDoc, serverTimestamp, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast, { Toaster } from 'react-hot-toast';

export default function JobsPage() {
  const { locale, theme } = useAppStore();
  const { user } = useAuthStore();
  const isAr = locale === 'ar';
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
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
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setJobs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
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
      setPostForm({ title: '', description: '', country: '', city: '', type: 'full-time', salary: '', requirements: '' });
      loadJobs();
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleApply = async (jobId: string) => {
    if (!user || user.role !== 'individual') return;

    try {
      await addDoc(collection(db, 'applications'), {
        jobId,
        applicantId: user.uid,
        applicantName: user.displayName,
        message: applyMessage,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Send notification to company
      const job = jobs.find(j => j.id === jobId);
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
                {isAr ? 'الوظائف المتاحة' : 'Available Jobs'}
              </h1>
              <p className="text-[var(--foreground-secondary)] text-sm mt-1">
                {isAr ? 'تصفح الوظائف وتقدم مباشرة' : 'Browse jobs and apply directly'}
              </p>
            </div>
            {user?.role === 'company' && (
              <Button onClick={() => setShowPostForm(true)}>
                <FiPlus size={18} />
                {isAr ? 'نشر وظيفة' : 'Post a Job'}
              </Button>
            )}
          </div>

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
                        label={isAr ? 'عنوان الوظيفة' : 'Job Title'}
                        value={postForm.title}
                        onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                        placeholder={isAr ? 'مثال: مطور ويب' : 'e.g. Web Developer'}
                        required
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
                        {isAr ? 'وصف الوظيفة' : 'Job Description'}
                      </label>
                      <textarea
                        value={postForm.description}
                        onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] resize-none"
                        required
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
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 rounded-2xl bg-[var(--background-secondary)] animate-pulse" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-[var(--foreground-secondary)]">
              <FiBriefcase size={48} className="mx-auto mb-4 opacity-50" />
              <p>{isAr ? 'لا توجد وظائف متاحة حالياً' : 'No jobs available yet'}</p>
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
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-bold text-sm">
                            {job.companyName?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-[var(--foreground)]">{job.title}</h3>
                            <p className="text-sm text-[var(--foreground-secondary)]">{job.companyName}</p>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--foreground-secondary)] mb-3 line-clamp-2">
                          {job.description}
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
                      </div>
                      {user?.role === 'individual' && (
                        <Button onClick={() => setShowApplyModal(job.id)} size="sm">
                          <FiSend size={14} />
                          {isAr ? 'تقديم' : 'Apply'}
                        </Button>
                      )}
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
