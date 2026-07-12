'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FiUsers, FiBriefcase, FiFileText, FiTrendingUp, FiShield, FiActivity, FiUserPlus, FiSettings, FiHome } from 'react-icons/fi';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { locale, theme } = useAppStore();
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ users: 0, companies: 0, requests: 0, newToday: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      router.push('/');
      return;
    }
    loadStats();
  }, [authLoading, router, user]);

  if (authLoading || !user) return null;

  const loadStats = async () => {
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'individual')));
      const companiesSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'company')));
      const requestsSnap = await getDocs(collection(db, 'cvRequests'));

      setStats({
        users: usersSnap.size,
        companies: companiesSnap.size,
        requests: requestsSnap.size,
        newToday: 0,
      });

      const allUsers = await getDocs(collection(db, 'users'));
      setUsers(allUsers.docs.map(d => ({ id: d.id, ...d.data() })));

      const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', 'in', ['admin', 'superadmin'])));
      setAdmins(adminsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    await updateDoc(doc(db, 'users', userId), { isActive: !isActive });
    loadStats();
  };

  const statCards = [
    { icon: <FiUsers size={24} />, label: isAr ? 'إجمالي المستخدمين' : 'Total Users', value: stats.users, color: 'from-blue-500 to-blue-600' },
    { icon: <FiBriefcase size={24} />, label: isAr ? 'إجمالي الشركات' : 'Total Companies', value: stats.companies, color: 'from-amber-500 to-amber-600' },
    { icon: <FiFileText size={24} />, label: isAr ? 'طلبات CV' : 'CV Requests', value: stats.requests, color: 'from-green-500 to-green-600' },
    { icon: <FiTrendingUp size={24} />, label: isAr ? 'جديد اليوم' : 'New Today', value: stats.newToday, color: 'from-purple-500 to-purple-600' },
  ];

  const tabs = [
    { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview', icon: <FiActivity size={18} /> },
    { id: 'users', label: isAr ? 'المستخدمين' : 'Users', icon: <FiUsers size={18} /> },
    { id: 'companies', label: isAr ? 'الشركات' : 'Companies', icon: <FiBriefcase size={18} /> },
    ...(user?.role === 'superadmin' ? [{ id: 'admins', label: isAr ? 'المشرفين' : 'Admins', icon: <FiShield size={18} /> }] : []),
    { id: 'settings', label: isAr ? 'الإعدادات' : 'Settings', icon: <FiSettings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="fixed top-0 start-0 h-full w-64 bg-[var(--card)] border-e border-[var(--border)] p-6 hidden lg:block">
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-8">
          Uni<span className="text-[var(--primary-light)]">Company</span>
        </h2>
        <nav className="space-y-2">
          <a
            href="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-start text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]"
          >
            <FiHome size={18} />
            {isAr ? 'العودة للموقع' : 'Back to Site'}
          </a>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-start ${
                activeTab === tab.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:ms-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {isAr ? 'لوحة التحكم' : 'Dashboard'}
            </h1>
            <p className="text-[var(--foreground-secondary)]">
              {isAr ? `مرحباً، ${user?.displayName}` : `Welcome, ${user?.displayName}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent)]/20 text-[var(--accent)]">
              {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card hover={false}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--foreground-secondary)]">{stat.label}</p>
                        <p className="text-3xl font-bold text-[var(--foreground)] mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-white`}>
                        {stat.icon}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Activity Chart Placeholder */}
            <Card hover={false} className="mb-8">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                {isAr ? 'النشاط الأسبوعي' : 'Weekly Activity'}
              </h3>
              <div className="h-64 flex items-end justify-between gap-2 px-4">
                {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex-1 bg-gradient-to-t from-[var(--primary)] to-[var(--primary-light)] rounded-t-lg"
                  />
                ))}
              </div>
              <div className="flex justify-between px-4 mt-2 text-xs text-[var(--foreground-secondary)]">
                {(isAr ? ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'] : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']).map(day => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Users Management */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card hover={false}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {isAr ? 'إدارة المستخدمين' : 'Manage Users'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-start py-3 px-4 text-sm font-medium text-[var(--foreground-secondary)]">{isAr ? 'الاسم' : 'Name'}</th>
                      <th className="text-start py-3 px-4 text-sm font-medium text-[var(--foreground-secondary)]">{isAr ? 'البريد' : 'Email'}</th>
                      <th className="text-start py-3 px-4 text-sm font-medium text-[var(--foreground-secondary)]">{isAr ? 'النوع' : 'Type'}</th>
                      <th className="text-start py-3 px-4 text-sm font-medium text-[var(--foreground-secondary)]">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="text-start py-3 px-4 text-sm font-medium text-[var(--foreground-secondary)]">{isAr ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role === 'individual' || u.role === 'company').map(u => (
                      <tr key={u.id} className="border-b border-[var(--border)] hover:bg-[var(--background-secondary)]">
                        <td className="py-3 px-4 text-[var(--foreground)]">{u.displayName}</td>
                        <td className="py-3 px-4 text-[var(--foreground-secondary)]">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'company' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.role === 'company' ? (isAr ? 'شركة' : 'Company') : (isAr ? 'فرد' : 'Individual')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {u.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معلق' : 'Suspended')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant={u.isActive ? 'danger' : 'primary'}
                            size="sm"
                            onClick={() => toggleUserStatus(u.id, u.isActive)}
                          >
                            {u.isActive ? (isAr ? 'تعليق' : 'Suspend') : (isAr ? 'تفعيل' : 'Activate')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Admins Management (Super Admin Only) */}
        {activeTab === 'admins' && user?.role === 'superadmin' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card hover={false}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {isAr ? 'إدارة المشرفين' : 'Manage Admins'}
                </h3>
                <Button size="sm">
                  <FiUserPlus size={16} />
                  {isAr ? 'إضافة مشرف' : 'Add Admin'}
                </Button>
              </div>
              <div className="space-y-4">
                {admins.map(admin => (
                  <div key={admin.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-secondary)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-bold">
                        {admin.displayName?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{admin.displayName || admin.email}</p>
                        <p className="text-sm text-[var(--foreground-secondary)]">{admin.email}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      admin.role === 'superadmin' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
