'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiMessageSquare, FiSettings, FiLogOut, FiSearch, FiUser, FiBell, FiGrid } from 'react-icons/fi';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { locale } = useAppStore();
  const { user, setUser } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const isAr = locale === 'ar';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0);
      return;
    }

    const unreadQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      setUnreadNotifications(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  const navLinks = [
    { href: '/', label: isAr ? 'الرئيسية' : 'Home' },
    { href: '/companies', label: isAr ? 'الشركات' : 'Companies' },
    { href: '/talents', label: isAr ? 'طالبي العمل' : 'Talents' },
    { href: '/jobs', label: isAr ? 'الوظائف' : 'Jobs' },
    { href: '/search', label: isAr ? 'البحث' : 'Search' },
    { href: '/faq', label: isAr ? 'الأسئلة' : 'FAQ' },
  ];

  const userLinks = user
    ? [
        ...(isAdmin ? [{ href: '/admin', label: isAr ? 'لوحة التحكم' : 'Dashboard', icon: FiSettings, accent: true }] : [{ href: '/dashboard', label: isAr ? 'لوحتي' : 'My Dashboard', icon: FiGrid }]),
        { href: '/notifications', label: isAr ? 'الإشعارات' : 'Notifications', icon: FiBell },
        { href: '/chat', label: isAr ? 'المحادثات' : 'Chat', icon: FiMessageSquare },
        { href: '/profile', label: isAr ? 'الملف الشخصي' : 'Profile', icon: FiUser },
      ]
    : [];

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setUnreadNotifications(0);
    setMobileOpen(false);
    router.replace('/auth/login');
    router.refresh();
  };

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
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 transition-colors font-medium text-sm ${
                  isActiveLink(link.href)
                    ? 'bg-[var(--primary)]/10 text-[var(--primary-light)]'
                    : 'text-[var(--foreground)] hover:text-[var(--primary-light)] hover:bg-[var(--background-secondary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <>
                {userLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link href={item.href} key={item.href}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className={`p-2 rounded-xl transition-all ${
                          item.accent
                            ? 'bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20'
                            : isActiveLink(item.href)
                              ? 'bg-[var(--primary)]/10 text-[var(--primary-light)]'
                              : 'text-[var(--foreground)] hover:text-[var(--primary-light)] hover:bg-[var(--background-secondary)]'
                        }`}
                        title={item.label}
                      >
                          <span className="relative block">
                            <Icon size={20} />
                            {item.href === '/notifications' && unreadNotifications > 0 && (
                              <span className="absolute -top-2 -end-2 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[var(--error)] text-white text-[10px] leading-[1.1rem] font-bold text-center">
                                {unreadNotifications > 9 ? '9+' : unreadNotifications}
                              </span>
                            )}
                          </span>
                      </motion.button>
                    </Link>
                  );
                })}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => void handleLogout()}
                  className="p-2 rounded-xl text-[var(--foreground)] hover:text-[var(--error)] hover:bg-[var(--background-secondary)] transition-all"
                  title={isAr ? 'تسجيل الخروج' : 'Logout'}
                >
                  <FiLogOut size={20} />
                </motion.button>
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
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-3 px-3 rounded-xl font-medium text-sm transition-colors ${
                    isActiveLink(link.href)
                      ? 'bg-[var(--primary)]/10 text-[var(--primary-light)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--background-secondary)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <>
                  <div className="pt-2 border-t border-[var(--border)] space-y-2">
                    {userLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2 py-3 px-3 rounded-xl font-medium text-sm transition-colors ${
                          item.accent
                            ? 'text-[var(--accent)] hover:bg-[var(--accent)]/10'
                            : isActiveLink(item.href)
                              ? 'bg-[var(--primary)]/10 text-[var(--primary-light)]'
                              : 'text-[var(--foreground)] hover:bg-[var(--background-secondary)]'
                        }`}
                      >
                        <span className="relative block">
                          <item.icon size={16} />
                          {item.href === '/notifications' && unreadNotifications > 0 && (
                            <span className="absolute -top-2 -end-2 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[var(--error)] text-white text-[10px] leading-[1.1rem] font-bold text-center">
                              {unreadNotifications > 9 ? '9+' : unreadNotifications}
                            </span>
                          )}
                        </span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
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
                  <button
                    onClick={() => void handleLogout()}
                    className="block w-full text-center py-3 rounded-xl bg-[var(--error)]/10 text-[var(--error)] font-medium text-sm"
                  >
                    {isAr ? 'تسجيل الخروج' : 'Logout'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
