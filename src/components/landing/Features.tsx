'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import Card from '@/components/ui/Card';
import { FiUser, FiBriefcase, FiShield, FiSearch, FiMessageSquare, FiGlobe } from 'react-icons/fi';

export default function Features() {
  const { locale } = useAppStore();
  const isAr = locale === 'ar';

  const features = [
    {
      icon: <FiUser size={24} />,
      title: isAr ? 'للأفراد' : 'For Individuals',
      description: isAr
        ? 'ارفع سيرتك الذاتية واعرض مهاراتك أمام أفضل الشركات حول العالم'
        : 'Upload your CV and showcase your skills to top companies worldwide',
    },
    {
      icon: <FiBriefcase size={24} />,
      title: isAr ? 'للشركات' : 'For Companies',
      description: isAr
        ? 'اعرض خدماتك ومشاريعك وابحث عن أفضل الكفاءات'
        : 'Display your services and projects, find the best talents',
    },
    {
      icon: <FiShield size={24} />,
      title: isAr ? 'آمن وموثوق' : 'Secure & Trusted',
      description: isAr
        ? 'بياناتك محمية بأعلى معايير الأمان. سيرتك الذاتية لا تُعرض إلا بموافقتك'
        : 'Your data is protected with highest security. Your CV is only shared with your approval',
    },
    {
      icon: <FiSearch size={24} />,
      title: isAr ? 'بحث متقدم' : 'Advanced Search',
      description: isAr
        ? 'ابحث حسب الدولة، التخصص، الخبرة، والمهارات'
        : 'Search by country, specialization, experience, and skills',
    },
    {
      icon: <FiMessageSquare size={24} />,
      title: isAr ? 'تواصل مباشر' : 'Direct Communication',
      description: isAr
        ? 'نظام محادثات مدمج للتواصل بين الأفراد والشركات'
        : 'Built-in chat system for communication between individuals and companies',
    },
    {
      icon: <FiGlobe size={24} />,
      title: isAr ? 'عالمي' : 'Global',
      description: isAr
        ? 'منصة عالمية تدعم العربية والإنجليزية وتربط بين دول مختلفة'
        : 'A global platform supporting Arabic and English, connecting different countries',
    },
  ];

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10 sm:mb-16"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--foreground)]">
          {isAr ? 'لماذا UniCompany؟' : 'Why UniCompany?'}
        </h2>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[var(--foreground-secondary)] max-w-2xl mx-auto px-2">
          {isAr
            ? 'نوفر لك كل ما تحتاجه للتواصل مع الشركات أو إيجاد أفضل الكفاءات'
            : 'We provide everything you need to connect with companies or find the best talents'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="h-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white mb-3 sm:mb-4">
                {feature.icon}
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-1.5 sm:mb-2">
                {feature.title}
              </h3>
              <p className="text-[var(--foreground-secondary)] text-xs sm:text-sm leading-relaxed">
                {feature.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
