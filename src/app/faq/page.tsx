'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { FiChevronDown } from 'react-icons/fi';

export default function FAQPage() {
  const { locale, theme } = useAppStore();
  const isAr = locale === 'ar';
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  const faqs = isAr ? [
    { q: 'ما هي منصة UniCompany؟', a: 'UniCompany هي منصة وسيطة تربط بين الأفراد الباحثين عن فرص عمل والشركات التي تبحث عن كفاءات. يمكن للأفراد رفع سيرهم الذاتية وللشركات عرض خدماتها.' },
    { q: 'كيف أسجل كفرد؟', a: 'اضغط على "إنشاء حساب"، اختر "فرد"، أدخل بياناتك الأساسية (الاسم، البريد الإلكتروني، كلمة المرور)، ثم فعّل حسابك عبر رابط التحقق المرسل لبريدك.' },
    { q: 'كيف أسجل كشركة؟', a: 'اضغط على "إنشاء حساب"، اختر "شركة"، أدخل اسم الشركة ورقم السجل التجاري (إجباري) وبياناتك، ثم فعّل حسابك.' },
    { q: 'هل سيرتي الذاتية مرئية للجميع؟', a: 'لا. سيرتك الذاتية خاصة بشكل افتراضي. الشركات تستطيع رؤية معلوماتك الأساسية فقط (الاسم، التخصص، الدولة). للاطلاع على السيرة الذاتية الكاملة، يجب أن ترسل الشركة طلباً وتوافق أنت عليه.' },
    { q: 'كيف تتواصل الشركة معي؟', a: 'بعد موافقتك على طلب الاطلاع على سيرتك الذاتية، يُفتح شات مباشر بينك وبين الشركة للتواصل.' },
    { q: 'هل يمكنني التواصل مع الشركات مباشرة؟', a: 'نعم! يمكنك إرسال رسالة لأي شركة مسجلة على المنصة مباشرة بدون قيود.' },
    { q: 'هل المنصة مجانية؟', a: 'نعم، التسجيل والاستخدام مجاني حالياً لجميع المستخدمين والشركات.' },
    { q: 'هل بياناتي آمنة؟', a: 'نعم. نستخدم أعلى معايير الأمان بما في ذلك تشفير البيانات وحماية الحسابات. لكن المستخدم مسؤول عن حماية حسابه وكلمة مروره.' },
    { q: 'هل المنصة مسؤولة عن التعاملات بين الأطراف؟', a: 'لا. UniCompany وسيط فقط ولا تتحمل أي مسؤولية عن الاتفاقيات أو التعاملات بين المستخدمين والشركات.' },
  ] : [
    { q: 'What is UniCompany?', a: 'UniCompany is an intermediary platform connecting job-seeking individuals with companies looking for talents. Individuals can upload their CVs and companies can showcase their services.' },
    { q: 'How do I register as an individual?', a: 'Click "Create Account", select "Individual", enter your basic info (name, email, password), then verify your account via the link sent to your email.' },
    { q: 'How do I register as a company?', a: 'Click "Create Account", select "Company", enter your company name and commercial registration number (required), then verify your account.' },
    { q: 'Is my CV visible to everyone?', a: 'No. Your CV is private by default. Companies can only see your basic info (name, specialization, country). To view your full CV, a company must send a request and you must approve it.' },
    { q: 'How does a company contact me?', a: 'After you approve a CV access request, a direct chat opens between you and the company for communication.' },
    { q: 'Can I contact companies directly?', a: 'Yes! You can send a message to any registered company on the platform directly without restrictions.' },
    { q: 'Is the platform free?', a: 'Yes, registration and usage are currently free for all users and companies.' },
    { q: 'Is my data secure?', a: 'Yes. We use the highest security standards including data encryption and account protection. However, users are responsible for protecting their accounts and passwords.' },
    { q: 'Is the platform responsible for transactions between parties?', a: 'No. UniCompany is solely an intermediary and bears no responsibility for agreements or transactions between users and companies.' },
  ];

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">
            {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h1>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border border-[var(--border)] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-start hover:bg-[var(--background-secondary)] transition-colors"
                >
                  <span className="font-medium text-[var(--foreground)]">{faq.q}</span>
                  <motion.span
                    animate={{ rotate: openIndex === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronDown className="text-[var(--foreground-secondary)]" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="px-4 pb-4 text-[var(--foreground-secondary)] text-sm leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
