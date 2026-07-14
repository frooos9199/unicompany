'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FiActivity, FiArrowRight, FiBriefcase, FiCheckCircle, FiFileText, FiGlobe, FiHome, FiSearch, FiSettings, FiShield, FiTrendingUp, FiUserPlus, FiUsers } from 'react-icons/fi';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminPermission, AppUser, CVRequest, Job } from '@/types';
import toast, { Toaster } from 'react-hot-toast';

interface DashboardStats {
  users: number;
  companies: number;
  requests: number;
  activeJobs: number;
  admins: number;
}

const FULL_ADMIN_PERMISSIONS: AdminPermission[] = [
  'manage_users',
  'manage_companies',
  'manage_admins',
  'view_analytics',
  'manage_content',
  'view_logs',
];

function getTimeValue(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value && 'seconds' in value && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  return 0;
}

function sortByRecent<T extends { createdAt?: unknown; updatedAt?: unknown }>(items: T[]) {
  return [...items].sort((left, right) => getTimeValue(right.updatedAt ?? right.createdAt) - getTimeValue(left.updatedAt ?? left.createdAt));
}

export default function AdminPage() {
  const { locale, theme } = useAppStore();
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ users: 0, companies: 0, requests: 0, activeJobs: 0, admins: 0 });
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [allRequests, setAllRequests] = useState<CVRequest[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [savingAdmin, setSavingAdmin] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  async function getDashboardData() {
    const [usersSnap, requestsSnap, jobsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'cvRequests')),
      getDocs(collection(db, 'jobs')),
    ]);

    const accounts = usersSnap.docs.map((snapshot) => ({ uid: snapshot.id, ...snapshot.data() } as AppUser));
    const requestRecords = requestsSnap.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() } as CVRequest));
    const jobRecords = jobsSnap.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() } as Job));

    const individuals = accounts.filter((account) => account.role === 'individual');
    const companies = accounts.filter((account) => account.role === 'company');
    const admins = accounts.filter((account) => account.role === 'admin' || account.role === 'superadmin');

    return {
      stats: {
        users: individuals.length,
        companies: companies.length,
        requests: requestRecords.length,
        activeJobs: jobRecords.filter((job) => job.status === 'active').length,
        admins: admins.length,
      },
      accounts,
      requestRecords,
      jobRecords,
    };
  }

  const reloadDashboard = async () => {
    setLoading(true);
    try {
      const dashboardData = await getDashboardData();
      setStats(dashboardData.stats);
      setAllUsers(dashboardData.accounts);
      setAllRequests(dashboardData.requestRecords);
      setJobs(dashboardData.jobRecords);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      toast.error(isAr ? 'تعذر تحميل لوحة الأدمن' : 'Could not load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !isAdmin) {
      router.push('/');
      return;
    }

    void reloadDashboard();
  }, [authLoading, isAdmin, router, user]);

  if (authLoading || !user) return null;

  const people = allUsers.filter((account) => account.role === 'individual');
  const companies = allUsers.filter((account) => account.role === 'company');
  const admins = allUsers.filter((account) => account.role === 'admin' || account.role === 'superadmin');
  const filteredUsers = allUsers.filter((account) => {
    if (!(account.role === 'individual' || account.role === 'company' || account.role === 'admin' || account.role === 'superadmin')) {
      return false;
    }

    if (!searchQuery) {
      return true;
    }

    const queryValue = searchQuery.toLowerCase();
    return (
      account.displayName?.toLowerCase().includes(queryValue) ||
      account.email?.toLowerCase().includes(queryValue) ||
      account.companyName?.toLowerCase().includes(queryValue)
    );
  });

  const recentUsers = useMemo(() => sortByRecent(filteredUsers).slice(0, 6), [filteredUsers]);
  const recentRequests = useMemo(() => sortByRecent(allRequests).slice(0, 6), [allRequests]);
  const pendingRequestsCount = useMemo(() => allRequests.filter((request) => request.status === 'pending').length, [allRequests]);
  const activeCompaniesCount = useMemo(() => companies.filter((account) => account.isActive).length, [companies]);

  const statCards = [
    { icon: <FiUsers size={22} />, label: isAr ? 'الأفراد' : 'Individuals', value: stats.users, color: 'from-blue-500 to-cyan-500' },
    { icon: <FiBriefcase size={22} />, label: isAr ? 'الشركات' : 'Companies', value: stats.companies, color: 'from-amber-500 to-orange-500' },
    { icon: <FiFileText size={22} />, label: isAr ? 'طلبات السيرة' : 'CV Requests', value: stats.requests, color: 'from-emerald-500 to-green-500' },
    { icon: <FiTrendingUp size={22} />, label: isAr ? 'وظائف نشطة' : 'Active Jobs', value: stats.activeJobs, color: 'from-violet-500 to-fuchsia-500' },
  ];

  const tabs = [
    { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview', icon: <FiActivity size={18} /> },
    { id: 'users', label: isAr ? 'المستخدمين' : 'Users', icon: <FiUsers size={18} /> },
    { id: 'companies', label: isAr ? 'الشركات' : 'Companies', icon: <FiBriefcase size={18} /> },
    { id: 'admins', label: isAr ? 'المشرفين' : 'Admins', icon: <FiShield size={18} /> },
    { id: 'settings', label: isAr ? 'الإعدادات' : 'Settings', icon: <FiSettings size={18} /> },
  ];

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    await updateDoc(doc(db, 'users', userId), { isActive: !isActive });
    toast.success(!isActive ? (isAr ? 'تم تفعيل المستخدم' : 'User activated') : (isAr ? 'تم تعليق المستخدم' : 'User suspended'));
    await reloadDashboard();
  };

  const grantFullAdminPermissions = async (account: AppUser) => {
    await updateDoc(doc(db, 'users', account.uid), {
      role: account.role === 'superadmin' ? 'superadmin' : 'admin',
      permissions: FULL_ADMIN_PERMISSIONS,
      updatedAt: new Date(),
    });
    toast.success(isAr ? 'تم منح جميع الصلاحيات' : 'Full permissions granted');
    await reloadDashboard();
  };

  const promoteToAdmin = async () => {
    if (!adminEmail.trim()) {
      toast.error(isAr ? 'أدخل البريد الإلكتروني أولًا' : 'Enter an email first');
      return;
    }

    setSavingAdmin(true);
    try {
      const adminQuery = await getDocs(query(collection(db, 'users'), where('email', '==', adminEmail.trim())));
      if (adminQuery.empty) {
        toast.error(isAr ? 'لا يوجد مستخدم بهذا البريد' : 'No user found with that email');
        return;
      }

      const targetUser = adminQuery.docs[0];
      await updateDoc(doc(db, 'users', targetUser.id), {
        role: 'admin',
        permissions: FULL_ADMIN_PERMISSIONS,
        updatedAt: new Date(),
      });

      toast.success(isAr ? 'تمت ترقية المستخدم إلى أدمن بصلاحيات كاملة' : 'User promoted to full-access admin');
      setAdminEmail('');
      await reloadDashboard();
    } finally {
      setSavingAdmin(false);
    }
  };

  const renderUserRow = (account: AppUser) => {
    const profileHref = account.role === 'company' ? `/companies/${account.uid}` : account.role === 'individual' ? `/talents/${account.uid}` : null;

    return (
      <tr key={account.uid} className="border-b border-[var(--border)] hover:bg-[var(--background-secondary)]/60 transition-colors">
        <td className="py-3 px-4">
          {profileHref ? (
            <Link href={profileHref} className="font-medium text-[var(--foreground)] hover:text-[var(--primary-light)] transition-colors inline-flex items-center gap-2">
              <span>{account.displayName || account.companyName || account.email}</span>
              <FiArrowRight size={14} />
            </Link>
          ) : (
            <span className="font-medium text-[var(--foreground)]">{account.displayName || account.email}</span>
          )}
        </td>
        <td className="py-3 px-4 text-[var(--foreground-secondary)] break-all">{account.email}</td>
        <td className="py-3 px-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${account.role === 'company' ? 'bg-amber-100 text-amber-700' : account.role === 'individual' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
            {account.role === 'company' ? (isAr ? 'شركة' : 'Company') : account.role === 'individual' ? (isAr ? 'فرد' : 'Individual') : 'Admin'}
          </span>
        </td>
        <td className="py-3 px-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${account.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {account.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معلق' : 'Suspended')}
          </span>
        </td>
        <td className="py-3 px-4">
          <div className="flex flex-wrap gap-2">
            {profileHref && (
              <Link href={profileHref}><Button variant="secondary" size="sm">{isAr ? 'فتح الصفحة' : 'Open Page'}</Button></Link>
            )}
            {(account.role === 'individual' || account.role === 'company') && (
              <Button
                variant={account.isActive ? 'danger' : 'primary'}
                size="sm"
                onClick={() => void toggleUserStatus(account.uid, Boolean(account.isActive))}
              >
                {account.isActive ? (isAr ? 'تعليق' : 'Suspend') : (isAr ? 'تفعيل' : 'Activate')}
              </Button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Toaster position="top-center" />

      <aside className="fixed top-0 start-0 h-full w-64 bg-[var(--card)] border-e border-[var(--border)] p-6 hidden xl:block overflow-y-auto">
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-8">
          Uni<span className="text-[var(--primary-light)]">Company</span>
        </h2>
        <nav className="space-y-2">
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-start text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]">
            <FiHome size={18} />
            {isAr ? 'العودة للموقع' : 'Back to Site'}
          </Link>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-start ${activeTab === tab.id ? 'bg-[var(--primary)] text-white' : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="xl:ms-64 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">{isAr ? 'لوحة تحكم الأدمن' : 'Admin Control Center'}</h1>
            <p className="text-[var(--foreground-secondary)] mt-1">{isAr ? `صلاحيات كاملة وإدارة مباشرة لكل أجزاء المنصة، ${user.displayName}` : `Full-access control for the platform, ${user.displayName}`}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent)]/15 text-[var(--accent)]">{isAr ? 'أدمن بصلاحيات كاملة' : 'Full-access admin'}</span>
            <Link href="/"><Button variant="secondary">{isAr ? 'زيارة الموقع' : 'Visit site'}</Button></Link>
          </div>
        </div>

        <div className="xl:hidden mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-[var(--primary)] text-white' : 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 sm:gap-6">
              {statCards.map((stat, index) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                  <Card hover={false}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-[var(--foreground-secondary)]">{stat.label}</p>
                        <p className="text-3xl font-bold text-[var(--foreground)] mt-2">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                        {stat.icon}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-[1.4fr_1fr] gap-6">
              <Card hover={false}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[var(--foreground)]">{isAr ? 'صحة المنصة' : 'Platform Health'}</h3>
                  <span className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'قراءة تشغيلية سريعة' : 'Operational snapshot'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-[var(--background-secondary)] p-4">
                    <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'شركات نشطة' : 'Active companies'}</p>
                    <p className="text-2xl font-semibold text-[var(--foreground)] mt-1">{activeCompaniesCount}</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--background-secondary)] p-4">
                    <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'طلبات معلقة' : 'Pending requests'}</p>
                    <p className="text-2xl font-semibold text-[var(--foreground)] mt-1">{pendingRequestsCount}</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--background-secondary)] p-4">
                    <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'عدد الأدمن' : 'Admin count'}</p>
                    <p className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.admins}</p>
                  </div>
                </div>
              </Card>

              <Card hover={false}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[var(--foreground)]">{isAr ? 'إجراءات الإدارة' : 'Admin Actions'}</h3>
                </div>
                <div className="space-y-3">
                  <Link href="/companies" className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3 hover:border-[var(--primary-light)] transition-colors">
                    <span className="text-[var(--foreground)]">{isAr ? 'مراجعة صفحة الشركات' : 'Review companies page'}</span>
                    <FiArrowRight size={16} className="text-[var(--primary-light)]" />
                  </Link>
                  <Link href="/talents" className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3 hover:border-[var(--primary-light)] transition-colors">
                    <span className="text-[var(--foreground)]">{isAr ? 'مراجعة صفحة الأشخاص' : 'Review talents page'}</span>
                    <FiArrowRight size={16} className="text-[var(--primary-light)]" />
                  </Link>
                  <Link href="/dashboard" className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3 hover:border-[var(--primary-light)] transition-colors">
                    <span className="text-[var(--foreground)]">{isAr ? 'فحص لوحة المستخدم' : 'Inspect user dashboard'}</span>
                    <FiArrowRight size={16} className="text-[var(--primary-light)]" />
                  </Link>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
              <Card hover={false}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[var(--foreground)]">{isAr ? 'أحدث المستخدمين' : 'Recent users'}</h3>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('users')}>{isAr ? 'إدارة' : 'Manage'}</Button>
                </div>
                <div className="space-y-3">
                  {recentUsers.map((account) => (
                    <div key={account.uid} className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{account.displayName || account.companyName || account.email}</p>
                        <p className="text-sm text-[var(--foreground-secondary)]">{account.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {account.role === 'company' && <Link href={`/companies/${account.uid}`}><Button variant="secondary" size="sm">{isAr ? 'صفحة الشركة' : 'Company page'}</Button></Link>}
                        {account.role === 'individual' && <Link href={`/talents/${account.uid}`}><Button variant="secondary" size="sm">{isAr ? 'صفحة الشخص' : 'Talent page'}</Button></Link>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card hover={false}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[var(--foreground)]">{isAr ? 'آخر طلبات السيرة' : 'Recent CV requests'}</h3>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('settings')}>{isAr ? 'الإعدادات' : 'Settings'}</Button>
                </div>
                <div className="space-y-3">
                  {recentRequests.map((request) => (
                    <div key={request.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{request.companyName || request.companyId}</p>
                        <p className="text-sm text-[var(--foreground-secondary)]">{request.individualName || request.individualId}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${request.status === 'approved' ? 'bg-green-100 text-green-700' : request.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {request.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {(activeTab === 'users' || activeTab === 'companies') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card hover={false}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--foreground)]">{activeTab === 'users' ? (isAr ? 'كل المستخدمين' : 'All users') : (isAr ? 'كل الشركات' : 'All companies')}</h3>
                  <p className="text-sm text-[var(--foreground-secondary)] mt-1">{isAr ? 'كل صف هنا قابل للدخول إلى الصفحة الكاملة للمستخدم أو الشركة.' : 'Each row now links to the full public page for that user or company.'}</p>
                </div>
                <div className="w-full lg:w-80">
                  <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={isAr ? 'ابحث بالاسم أو البريد...' : 'Search by name or email...'} icon={<FiSearch />} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-start py-3 px-4 text-sm font-medium text-[var(--foreground-secondary)]">{isAr ? 'الاسم' : 'Name'}</th>
                      <th className="text-start py-3 px-4 text-sm font-medium text-[var(--foreground-secondary)]">{isAr ? 'البريد' : 'Email'}</th>
                      <th className="text-start py-3 px-4 text-sm font-medium text-[var(--foreground-secondary)]">{isAr ? 'النوع' : 'Type'}</th>
                      <th className="text-start py-3 px-4 text-sm font-medium text-[var(--foreground-secondary)]">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="text-start py-3 px-4 text-sm font-medium text-[var(--foreground-secondary)]">{isAr ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'users' ? filteredUsers.filter((account) => account.role === 'individual' || account.role === 'company') : filteredUsers.filter((account) => account.role === 'company')).map(renderUserRow)}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'admins' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card hover={false}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--foreground)]">{isAr ? 'إدارة المشرفين' : 'Admin management'}</h3>
                  <p className="text-sm text-[var(--foreground-secondary)] mt-1">{isAr ? 'كل الأدمن لديهم الآن مسار واضح لصلاحيات كاملة داخل الموقع.' : 'Admins now have a clear full-access management path inside the site.'}</p>
                </div>
                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-80">
                    <Input value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder={isAr ? 'بريد المستخدم لترقيته إلى أدمن' : 'User email to promote as admin'} icon={<FiUserPlus />} />
                  </div>
                  <Button onClick={() => void promoteToAdmin()} loading={savingAdmin}>{isAr ? 'منح صلاحيات أدمن' : 'Grant admin access'}</Button>
                </div>
              </div>
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div key={admin.uid} className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{admin.displayName || admin.email}</p>
                      <p className="text-sm text-[var(--foreground-secondary)]">{admin.email}</p>
                      <p className="text-xs text-[var(--foreground-secondary)] mt-2">{isAr ? 'الصلاحيات:' : 'Permissions:'} {(admin.permissions && admin.permissions.length > 0 ? admin.permissions : FULL_ADMIN_PERMISSIONS).join(', ')}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${admin.role === 'superadmin' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-violet-100 text-violet-700'}`}>{admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}</span>
                      <Button variant="secondary" size="sm" onClick={() => void grantFullAdminPermissions(admin)}>{isAr ? 'كل الصلاحيات' : 'Full permissions'}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 2xl:grid-cols-[1.1fr_1fr] gap-6">
              <Card hover={false}>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">{isAr ? 'إعدادات المنصة' : 'Platform settings'}</h3>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[var(--background-secondary)] p-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{isAr ? 'صلاحيات الأدمن' : 'Admin permissions'}</p>
                      <p className="text-sm text-[var(--foreground-secondary)] mt-1">{isAr ? 'الأدمن يُعامل بصلاحيات كاملة داخل الإدارة ويمكن ترقيته أو تثبيته من هذه الصفحة.' : 'Admins are treated as full-access managers and can be promoted or normalized from here.'}</p>
                    </div>
                    <FiShield size={18} className="text-[var(--accent)] mt-1" />
                  </div>
                  <div className="rounded-2xl bg-[var(--background-secondary)] p-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{isAr ? 'التوافق مع الموبايل' : 'Mobile readiness'}</p>
                      <p className="text-sm text-[var(--foreground-secondary)] mt-1">{isAr ? 'تمت مراجعة الشرائط، التبويبات، والجداول لتتفادى الخروج عن الشاشة قدر الإمكان.' : 'Tabs, action areas, and tables have been tightened for better mobile behavior.'}</p>
                    </div>
                    <FiCheckCircle size={18} className="text-green-500 mt-1" />
                  </div>
                  <div className="rounded-2xl bg-[var(--background-secondary)] p-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{isAr ? 'ملفات المستخدمين' : 'User pages'}</p>
                      <p className="text-sm text-[var(--foreground-secondary)] mt-1">{isAr ? 'أي مستخدم أو شركة من الأدمن يمكن فتح صفحته العامة الكاملة مباشرة.' : 'Any user or company can now be opened directly into their full public page from admin.'}</p>
                    </div>
                    <FiGlobe size={18} className="text-[var(--primary-light)] mt-1" />
                  </div>
                </div>
              </Card>

              <Card hover={false}>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">{isAr ? 'ملخص التشغيل' : 'Operations summary'}</h3>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[var(--border)] p-4">
                    <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'السوق الرئيسي' : 'Primary market'}</p>
                    <p className="text-lg font-semibold text-[var(--foreground)] mt-1">{isAr ? 'الكويت' : 'Kuwait'}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] p-4">
                    <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'حسابات الشركة' : 'Company accounts'}</p>
                    <p className="text-lg font-semibold text-[var(--foreground)] mt-1">{companies.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] p-4">
                    <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'أعلى أولوية حالية' : 'Current top priority'}</p>
                    <p className="text-lg font-semibold text-[var(--foreground)] mt-1">{pendingRequestsCount > 0 ? (isAr ? 'طلبات السيرة المعلقة' : 'Pending CV requests') : (isAr ? 'الحالة مستقرة' : 'System looks stable')}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] p-4">
                    <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'عدد المدن الظاهرة' : 'Visible cities'}</p>
                    <p className="text-lg font-semibold text-[var(--foreground)] mt-1">{new Set(allUsers.map((account) => account.city).filter(Boolean)).size}</p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
