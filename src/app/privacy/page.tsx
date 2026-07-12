'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
  const { locale, theme } = useAppStore();
  const isAr = locale === 'ar';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
        </h1>
        <p className="text-[var(--foreground-secondary)] mb-8">
          {isAr ? 'آخر تحديث: يناير 2025' : 'Last Updated: January 2025'}
        </p>

        <div className="prose prose-lg max-w-none text-[var(--foreground-secondary)] space-y-6">
          {isAr ? (
            <>
              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">1. مقدمة</h2>
                <p>مرحباً بكم في منصة UniCompany. نحن نحترم خصوصيتكم ونلتزم بحماية بياناتكم الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتكم.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">2. دور المنصة</h2>
                <p>منصة UniCompany هي وسيط إلكتروني فقط بين الأفراد والشركات. المنصة لا تتحمل أي مسؤولية عن:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>صحة أو دقة البيانات المدخلة من قبل المستخدمين أو الشركات</li>
                  <li>أي اتفاقيات أو تعاملات تتم بين الأطراف</li>
                  <li>أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام المنصة</li>
                  <li>محتوى السير الذاتية أو معلومات الشركات</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">3. مسؤولية المستخدمين</h2>
                <p>المستخدمون (أفراد وشركات) مسؤولون مسؤولية كاملة عن:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>جميع البيانات والمعلومات التي يقدمونها على المنصة</li>
                  <li>صحة ودقة المعلومات المدخلة</li>
                  <li>حماية حساباتهم وكلمات المرور الخاصة بهم</li>
                  <li>أي تواصل أو اتفاقيات تتم مع أطراف أخرى عبر المنصة</li>
                </ul>
                <p className="mt-2 font-medium">لا يحق لأي مستخدم تحميل المنصة أي مسؤولية تتعلق ببياناته أو تعاملاته.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">4. البيانات التي نجمعها</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>معلومات التسجيل (الاسم، البريد الإلكتروني)</li>
                  <li>معلومات الملف الشخصي (التخصص، المهارات، الخبرة)</li>
                  <li>السير الذاتية المرفوعة</li>
                  <li>معلومات الشركات (الاسم، السجل التجاري، الخدمات)</li>
                  <li>سجل المحادثات داخل المنصة</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">5. الأمان</h2>
                <p>نستخدم أعلى معايير الأمان لحماية بياناتكم بما في ذلك:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>تشفير البيانات أثناء النقل (HTTPS/SSL)</li>
                  <li>تشفير كلمات المرور</li>
                  <li>قواعد أمان صارمة لقاعدة البيانات</li>
                  <li>حماية من الهجمات الإلكترونية (XSS, CSRF)</li>
                </ul>
                <p className="mt-2">مع ذلك، لا يمكن ضمان أمان أي نظام بنسبة 100%. المنصة لا تتحمل مسؤولية أي اختراق أو تسريب خارج عن إرادتها.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">6. السيرة الذاتية</h2>
                <p>السيرة الذاتية المرفوعة تكون خاصة بشكل افتراضي. لا يمكن لأي شركة الاطلاع عليها إلا بعد إرسال طلب وموافقة صاحب السيرة الذاتية.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">7. حقوقك</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>حق الوصول إلى بياناتك</li>
                  <li>حق تعديل أو حذف بياناتك</li>
                  <li>حق إلغاء حسابك في أي وقت</li>
                  <li>حق رفض أو قبول طلبات الاطلاع على سيرتك الذاتية</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">8. التواصل</h2>
                <p>لأي استفسارات حول سياسة الخصوصية، يرجى التواصل معنا عبر: support@unicompany.com</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">1. Introduction</h2>
                <p>Welcome to UniCompany platform. We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and protect your information.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">2. Platform Role</h2>
                <p>UniCompany is solely an intermediary platform between individuals and companies. The platform bears no responsibility for:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>The accuracy or validity of data entered by users or companies</li>
                  <li>Any agreements or transactions between parties</li>
                  <li>Any direct or indirect damages resulting from platform use</li>
                  <li>Content of CVs or company information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">3. User Responsibility</h2>
                <p>Users (individuals and companies) are fully responsible for:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>All data and information they provide on the platform</li>
                  <li>The accuracy and validity of entered information</li>
                  <li>Protecting their accounts and passwords</li>
                  <li>Any communication or agreements made with other parties through the platform</li>
                </ul>
                <p className="mt-2 font-medium">No user may hold the platform responsible for their data or transactions.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">4. Data We Collect</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>Registration information (name, email)</li>
                  <li>Profile information (specialization, skills, experience)</li>
                  <li>Uploaded CVs</li>
                  <li>Company information (name, commercial registration, services)</li>
                  <li>Chat history within the platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">5. Security</h2>
                <p>We use the highest security standards to protect your data including:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>Data encryption in transit (HTTPS/SSL)</li>
                  <li>Password encryption</li>
                  <li>Strict database security rules</li>
                  <li>Protection against cyber attacks (XSS, CSRF)</li>
                </ul>
                <p className="mt-2">However, no system can guarantee 100% security. The platform is not responsible for any breach beyond its control.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">6. CV Privacy</h2>
                <p>Uploaded CVs are private by default. No company can access them without sending a request and receiving approval from the CV owner.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">7. Your Rights</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>Right to access your data</li>
                  <li>Right to modify or delete your data</li>
                  <li>Right to cancel your account at any time</li>
                  <li>Right to approve or reject CV access requests</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">8. Contact</h2>
                <p>For any privacy policy inquiries, please contact us at: support@unicompany.com</p>
              </section>
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
