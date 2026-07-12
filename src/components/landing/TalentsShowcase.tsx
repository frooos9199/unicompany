'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FiMapPin, FiArrowRight, FiArrowLeft, FiUser } from 'react-icons/fi';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function TalentsShowcase() {
  const { locale } = useAppStore();
  const isAr = locale === 'ar';
  const [talents, setTalents] = useState<any[]>([]);

  useEffect(() => {
    loadTalents();
  }, []);

  const loadTalents = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'individual'), where('isActive', '==', true), limit(6));
      const snapshot = await getDocs(q);
      setTalents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      // No talents yet
    }
  };

  if (talents.length === 0) return null;

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 sm:mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            {isAr ? 'كفاءات تبحث عن عمل' : 'Talents Looking for Work'}
          </h2>
          <p className="text-sm text-[var(--foreground-secondary)] mt-1">
            {isAr ? 'أفراد مميزون جاهزون للعمل' : 'Outstanding individuals ready to work'}
          </p>
        </div>
        <Link href="/search">
          <Button variant="ghost" size="sm">
            {isAr ? 'الكل' : 'View All'}
            {isAr ? <FiArrowLeft size={16} /> : <FiArrowRight size={16} />}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {talents.map((talent, i) => (
          <motion.div
            key={talent.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center text-[var(--primary-dark)] font-bold text-sm flex-shrink-0">
                  {talent.displayName?.charAt(0) || <FiUser />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[var(--foreground)] text-sm truncate">{talent.displayName}</h3>
                  {talent.specialization && (
                    <p className="text-xs text-[var(--primary-light)]">{talent.specialization}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[var(--foreground-secondary)]">
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
                <div className="flex flex-wrap gap-1 mt-3">
                  {talent.skills.slice(0, 3).map((skill: string, j: number) => (
                    <span key={j} className="px-2 py-0.5 rounded-full text-xs bg-[var(--accent)]/10 text-[var(--accent)]">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
