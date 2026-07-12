'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiBell, FiMessageSquare, FiSettings } from 'react-icons/fi';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale } = useAppStore();
  const { user } = useAuthStore();

  const isAr = locale === 'ar';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const navLinks = [
    { href: '/', label: isAr ? 'الرئيسية' : 'Home' },
    { href: '/search', label: isAr ? 'البحث' : 'Search' },
    { href: '/companies', label: isAr ? 'الشركات' : 'Companies' },
    { href: '/jobs', label: isAr ? 'الوظائف' : 'Jobs' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
              Uni<span className="text-[var(--primary-light)]">Company</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--foreground)] hover:text-[var(--primary-light)] transition-colors font-medium text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all"
                      title={isAr ? 'لوحة التحكم' : 'Dashboard'}
                    >
                      <FiSettings size={20} />
                    </motion.button>
                  </Link>
                )}
                <Link href="/chat">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    className="p-2 rounded-xl text-[var(--foreground)] hover:text-[var(--primary-light)] relative"
                  >
                    <FiBell size={20} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--error)] rounded-full text-white text-[10px] flex items-center justify-center">
                      3
                    </span>
                  </motion.button>
                </Link>
                <Link href="/chat">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    className="p-2 rounded-xl text-[var(--foreground)] hover:text-[var(--primary-light)]"
                  >
                    <FiMessageSquare size={20} />
                  </motion.button>
                </Link>
              </>
            )}
            <LanguageToggle />
            <ThemeToggle />
            {!user ? (
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-xl bg-[var(--primary-light)] text-white font-medium hover:opacity-90 transition-all text-sm"
              >
                {isAr ? 'تسجيل الدخول' : 'Login'}
              </Link>
            ) : (
              <Link
                href="/profile"
                className="w-9 h-9 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-bold text-sm"
              >
                {user.displayName?.charAt(0) || 'U'}
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-1.5">
            <LanguageToggle />
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-[var(--foreground)]"
            >
              {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[var(--background)] border-t border-[var(--border)]"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 px-3 rounded-xl text-[var(--foreground)] hover:bg-[var(--background-secondary)] font-medium text-sm"
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 px-3 rounded-xl text-[var(--accent)] hover:bg-[var(--accent)]/10 font-medium text-sm"
                    >
                      {isAr ? '⚙️ لوحة التحكم' : '⚙️ Dashboard'}
                    </Link>
                  )}
                  <Link
                    href="/chat"
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 px-3 rounded-xl text-[var(--foreground)] hover:bg-[var(--background-secondary)] font-medium text-sm"
                  >
                    {isAr ? 'المحادثات' : 'Chat'}
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 px-3 rounded-xl text-[var(--foreground)] hover:bg-[var(--background-secondary)] font-medium text-sm"
                  >
                    {isAr ? 'الملف الشخصي' : 'Profile'}
                  </Link>
                </>
              )}
              <div className="pt-2">
                {!user ? (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center py-3 rounded-xl bg-[var(--primary-light)] text-white font-medium text-sm"
                  >
                    {isAr ? 'تسجيل الدخول' : 'Login'}
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center py-3 rounded-xl bg-[var(--error)]/10 text-[var(--error)] font-medium text-sm"
                  >
                    {isAr ? 'تسجيل الخروج' : 'Logout'}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
