'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FiMapPin, FiClock, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Job } from '@/types';
import { getLocalizedJobTitle } from '@/lib/i18n-content';

export default function LatestJobs() {
  const { locale } = useAppStore();
  const isAr = locale === 'ar';
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(4));
        const snapshot = await getDocs(q);
        setJobs(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Job)));
      } catch {
        // No jobs yet
      }
    };

    void loadJobs();
  }, []);

  if (jobs.length === 0) return null;

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'full-time': isAr ? 'دوام كامل' : 'Full-time',
      'part-time': isAr ? 'دوام جزئي' : 'Part-time',
      'remote': isAr ? 'عن بعد' : 'Remote',
      'contract': isAr ? 'عقد' : 'Contract',
      'freelance': isAr ? 'فريلانس' : 'Freelance',
    };
    return labels[type] || type;
  };

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 sm:mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            {isAr ? 'أحدث الوظائف' : 'Latest Jobs'}
          </h2>
          <p className="text-sm text-[var(--foreground-secondary)] mt-1">
            {isAr ? 'فرص عمل جديدة من شركات مسجلة' : 'New opportunities from registered companies'}
          </p>
        </div>
        <Link href="/jobs">
          <Button variant="ghost" size="sm">
            {isAr ? 'الكل' : 'View All'}
            {isAr ? <FiArrowLeft size={16} /> : <FiArrowRight size={16} />}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {jobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={`/jobs/${job.id}`} className="block h-full">
              <Card className="group h-full">
                <div className="flex items-start gap-3 mb-3">
                  {job.companyAvatar ? (
                    <img
                      src={job.companyAvatar}
                      alt={job.companyName || 'Company logo'}
                      className="w-10 h-10 rounded-xl object-cover border border-[var(--border)] bg-[var(--background-secondary)] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {job.companyName?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base truncate group-hover:text-[var(--primary-light)] transition-colors">{getLocalizedJobTitle(job, locale)}</h3>
                    <p className="text-xs sm:text-sm text-[var(--foreground-secondary)]">{job.companyName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-[var(--foreground-secondary)]">
                  {job.country && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--background-secondary)]">
                      <FiMapPin size={12} /> {job.country}
                    </span>
                  )}
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--background-secondary)]">
                    <FiClock size={12} /> {typeLabel(job.type)}
                  </span>
                </div>
                {job.requirements?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {job.requirements.slice(0, 3).map((req: string, j: number) => (
                      <span key={j} className="px-2 py-0.5 rounded-full text-xs bg-[var(--primary-light)]/10 text-[var(--primary-light)]">
                        {req}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 text-sm font-medium text-[var(--primary-light)] group-hover:text-[var(--primary)] transition-colors">
                  {isAr ? 'عرض كرت الوظيفة' : 'Open Job Card'}
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
