'use client';

import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { FiGlobe, FiMail, FiPhone } from 'react-icons/fi';

export default function Footer() {
  const { locale } = useAppStore();
  const isAr = locale === 'ar';

  return (
    <footer className="bg-[var(--background-secondary)] border-t border-[var(--border)] mt-12 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
              Uni<span className="text-[var(--primary-light)]">Company</span>
            </h3>
            <p className="mt-2 sm:mt-3 text-[var(--foreground-secondary)] text-sm sm:text-base max-w-md">
              {isAr
                ? 'منصة احترافية تربط أصحاب المهارات بالشركات الرائدة حول العالم'
                : 'A professional platform connecting skilled individuals with leading companies worldwide'}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-[var(--foreground)] mb-3 sm:mb-4 text-sm sm:text-base">
              {isAr ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/search" className="text-[var(--foreground-secondary)] hover:text-[var(--primary-light)] transition-colors text-sm">
                  {isAr ? 'البحث' : 'Search'}
                </Link>
              </li>
              <li>
                <Link href="/companies" className="text-[var(--foreground-secondary)] hover:text-[var(--primary-light)] transition-colors text-sm">
                  {isAr ? 'الشركات' : 'Companies'}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-[var(--foreground-secondary)] hover:text-[var(--primary-light)] transition-colors text-sm">
                  {isAr ? 'الأسئلة الشائعة' : 'FAQ'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-[var(--foreground)] mb-3 sm:mb-4 text-sm sm:text-base">
              {isAr ? 'قانوني' : 'Legal'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-[var(--foreground-secondary)] hover:text-[var(--primary-light)] transition-colors text-sm">
                  {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[var(--foreground-secondary)] hover:text-[var(--primary-light)] transition-colors text-sm">
                  {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
            © {new Date().getFullYear()} UniCompany. {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
          </p>
          <div className="flex items-center gap-4 text-[var(--foreground-secondary)]">
            <FiMail size={16} className="hover:text-[var(--primary-light)] cursor-pointer transition-colors" />
            <FiPhone size={16} className="hover:text-[var(--primary-light)] cursor-pointer transition-colors" />
            <FiGlobe size={16} className="hover:text-[var(--primary-light)] cursor-pointer transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  );
}
