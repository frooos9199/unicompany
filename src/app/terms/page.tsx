'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
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
          {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
        </h1>
        <p className="text-[var(--foreground-secondary)] mb-8">
          {isAr ? 'آخر تحديث: يناير 2025' : 'Last Updated: January 2025'}
        </p>

        <div className="prose prose-lg max-w-none text-[var(--foreground-secondary)] space-y-6">
          {isAr ? (
            <>
              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">1. القبول بالشروط</h2>
                <p>باستخدامك لمنصة UniCompany، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">2. طبيعة المنصة</h2>
                <p>UniCompany هي منصة وسيطة تهدف إلى:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>تمكين الأفراد من عرض مهاراتهم وسيرهم الذاتية</li>
                  <li>تمكين الشركات من عرض خدماتها والبحث عن كفاءات</li>
                  <li>تسهيل التواصل بين الطرفين</li>
                </ul>
                <p className="mt-2 font-medium">المنصة وسيط فقط ولا تعتبر طرفاً في أي اتفاق بين المستخدمين.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">3. إخلاء المسؤولية</h2>
                <p>المنصة غير مسؤولة عن:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>أي خسائر مالية أو معنوية ناتجة عن التعامل بين المستخدمين</li>
                  <li>صحة المعلومات المقدمة من المستخدمين أو الشركات</li>
                  <li>جودة الخدمات المقدمة من الشركات المسجلة</li>
                  <li>أي نزاعات بين الأطراف</li>
                  <li>انقطاع الخدمة لأسباب تقنية أو صيانة</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">4. التزامات المستخدم</h2>
                <p>يلتزم المستخدم بـ:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>تقديم معلومات صحيحة ودقيقة</li>
                  <li>عدم انتحال شخصية الغير</li>
                  <li>عدم استخدام المنصة لأغراض غير قانونية</li>
                  <li>الحفاظ على سرية بيانات حسابه</li>
                  <li>عدم مشاركة بيانات المستخدمين الآخرين دون إذن</li>
                  <li>الالتزام بقوانين الدولة التي يقيم فيها</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">5. التزامات الشركات</h2>
                <p>تلتزم الشركات المسجلة بـ:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>تقديم رقم سجل تجاري صحيح</li>
                  <li>عدم إساءة استخدام بيانات الأفراد</li>
                  <li>احترام خصوصية السير الذاتية وعدم مشاركتها مع أطراف ثالثة</li>
                  <li>التواصل بشكل مهني ومحترم</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">6. حقوق المنصة</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>تعليق أو إلغاء أي حساب يخالف الشروط</li>
                  <li>تعديل الشروط والأحكام في أي وقت</li>
                  <li>حذف أي محتوى مخالف</li>
                  <li>إيقاف الخدمة مؤقتاً للصيانة أو التحديث</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">7. الملكية الفكرية</h2>
                <p>جميع حقوق الملكية الفكرية للمنصة (التصميم، الشعار، الكود) محفوظة لـ UniCompany. المحتوى المرفوع من المستخدمين يبقى ملكاً لهم.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">8. إنهاء الحساب</h2>
                <p>يحق للمستخدم إلغاء حسابه في أي وقت. كما يحق للمنصة إنهاء أي حساب يخالف هذه الشروط دون إشعار مسبق.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">9. التواصل</h2>
                <p>لأي استفسارات حول شروط الاستخدام: support@unicompany.com</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">1. Acceptance of Terms</h2>
                <p>By using UniCompany platform, you agree to comply with these terms and conditions. If you do not agree to any of these terms, please do not use the platform.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">2. Platform Nature</h2>
                <p>UniCompany is an intermediary platform that aims to:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>Enable individuals to showcase their skills and CVs</li>
                  <li>Enable companies to display their services and search for talents</li>
                  <li>Facilitate communication between both parties</li>
                </ul>
                <p className="mt-2 font-medium">The platform is solely an intermediary and is not a party to any agreement between users.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">3. Disclaimer</h2>
                <p>The platform is not responsible for:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>Any financial or moral losses resulting from dealings between users</li>
                  <li>Accuracy of information provided by users or companies</li>
                  <li>Quality of services offered by registered companies</li>
                  <li>Any disputes between parties</li>
                  <li>Service interruption due to technical reasons or maintenance</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">4. User Obligations</h2>
                <p>Users must:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>Provide accurate and truthful information</li>
                  <li>Not impersonate others</li>
                  <li>Not use the platform for illegal purposes</li>
                  <li>Maintain account confidentiality</li>
                  <li>Not share other users data without permission</li>
                  <li>Comply with the laws of their country of residence</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">5. Company Obligations</h2>
                <p>Registered companies must:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>Provide a valid commercial registration number</li>
                  <li>Not misuse individual data</li>
                  <li>Respect CV privacy and not share with third parties</li>
                  <li>Communicate professionally and respectfully</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">6. Platform Rights</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>Suspend or cancel any account that violates terms</li>
                  <li>Modify terms and conditions at any time</li>
                  <li>Remove any violating content</li>
                  <li>Temporarily suspend service for maintenance or updates</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">7. Intellectual Property</h2>
                <p>All intellectual property rights of the platform (design, logo, code) are reserved to UniCompany. Content uploaded by users remains their property.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">8. Account Termination</h2>
                <p>Users may cancel their account at any time. The platform reserves the right to terminate any account that violates these terms without prior notice.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">9. Contact</h2>
                <p>For any terms of service inquiries: support@unicompany.com</p>
              </section>
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
