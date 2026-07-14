'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/lib/firebase';
import { CVRequest, Notification } from '@/types';
import { FiBell, FiCheckCircle, FiMessageSquare, FiSearch, FiXCircle } from 'react-icons/fi';
import { getCvRequestId } from '@/lib/cvProfiles';

function getTimeValue(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value && 'seconds' in value && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  return 0;
}

export default function NotificationsPage() {
  const { locale, theme } = useAppStore();
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const isAr = locale === 'ar';
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cvRequests, setCvRequests] = useState<CVRequest[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  }, [isAr, theme]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const loadNotifications = async () => {
      try {
        const [notificationsSnapshot, requestsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'notifications'), where('userId', '==', user.uid))),
          user.role === 'individual'
            ? getDocs(query(collection(db, 'cvRequests'), where('individualId', '==', user.uid)))
            : Promise.resolve(null),
        ]);

        setNotifications(notificationsSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Notification)));
        setCvRequests(requestsSnapshot ? requestsSnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as CVRequest)) : []);
      } finally {
        setLoading(false);
      }
    };

    void loadNotifications();
  }, [authLoading, router, user]);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((left, right) => getTimeValue(right.createdAt) - getTimeValue(left.createdAt));
  }, [notifications]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((item) => !item.read);
    await Promise.all(unread.map((item) => updateDoc(doc(db, 'notifications', item.id), { read: true })));
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  const getCvRequestForNotification = (notification: Notification) => {
    if (notification.type !== 'cv_request') {
      return null;
    }

    if (notification.data?.requestId) {
      return cvRequests.find((request) => request.id === notification.data?.requestId) || null;
    }

    return cvRequests.find((request) => request.companyId === notification.data?.companyId && request.status === 'pending') || null;
  };

  const respondToCvRequest = async (notification: Notification, nextStatus: 'approved' | 'rejected') => {
    if (!user || user.role !== 'individual') {
      return;
    }

    const request = getCvRequestForNotification(notification);
    if (!request) {
      const requestId = notification.data?.requestId || (notification.data?.companyId ? getCvRequestId(notification.data.companyId, user.uid) : null);
      if (!requestId) {
        return;
      }

      const requestSnapshot = await getDoc(doc(db, 'cvRequests', requestId));
      if (!requestSnapshot.exists()) {
        return;
      }

      const resolvedRequest = { id: requestSnapshot.id, ...requestSnapshot.data() } as CVRequest;
      await updateDoc(doc(db, 'cvRequests', resolvedRequest.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'notifications', notification.id), { read: true });

      await addDoc(collection(db, 'notifications'), {
        userId: resolvedRequest.companyId,
        type: nextStatus === 'approved' ? 'cv_approved' : 'cv_rejected',
        title: nextStatus === 'approved'
          ? (isAr ? 'تمت الموافقة على طلب السيرة' : 'CV request approved')
          : (isAr ? 'تم رفض طلب السيرة' : 'CV request rejected'),
        message: nextStatus === 'approved'
          ? (isAr ? `${user.displayName} وافق على طلب الاطلاع على السيرة الذاتية` : `${user.displayName} approved your CV access request`)
          : (isAr ? `${user.displayName} رفض طلب الاطلاع على السيرة الذاتية` : `${user.displayName} rejected your CV access request`),
        read: false,
        createdAt: serverTimestamp(),
        data: {
          companyId: resolvedRequest.companyId,
          individualId: user.uid,
          requestId: resolvedRequest.id,
        },
      });

      setCvRequests((current) => {
        const next = current.filter((item) => item.id !== resolvedRequest.id);
        return [...next, { ...resolvedRequest, status: nextStatus }];
      });
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
      return;
    }

    await updateDoc(doc(db, 'cvRequests', request.id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'notifications', notification.id), { read: true });

    await addDoc(collection(db, 'notifications'), {
      userId: request.companyId,
      type: nextStatus === 'approved' ? 'cv_approved' : 'cv_rejected',
      title: nextStatus === 'approved'
        ? (isAr ? 'تمت الموافقة على طلب السيرة' : 'CV request approved')
        : (isAr ? 'تم رفض طلب السيرة' : 'CV request rejected'),
      message: nextStatus === 'approved'
        ? (isAr ? `${user.displayName} وافق على طلب الاطلاع على السيرة الذاتية` : `${user.displayName} approved your CV access request`)
        : (isAr ? `${user.displayName} رفض طلب الاطلاع على السيرة الذاتية` : `${user.displayName} rejected your CV access request`),
      read: false,
      createdAt: serverTimestamp(),
      data: {
        companyId: request.companyId,
        individualId: user.uid,
        requestId: request.id,
      },
    });

    setCvRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: nextStatus } : item));
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
  };

  const getTargetLink = (notification: Notification) => {
    if (notification.type === 'new_message') return '/chat';
    if (notification.type === 'new_application' && notification.data?.jobId) return `/jobs/${notification.data.jobId}`;
    if ((notification.type === 'cv_request' || notification.type === 'cv_approved' || notification.type === 'cv_rejected') && notification.data?.companyId) return '/dashboard';
    return '/dashboard';
  };

  if (authLoading || !user) return null;

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <section className="rounded-[2rem] border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--accent)]/10 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-2">{isAr ? 'الإشعارات' : 'Notifications'}</h1>
                <p className="text-[var(--foreground-secondary)] max-w-2xl">
                  {isAr ? 'تابع آخر التنبيهات المتعلقة بالسيرة الذاتية والوظائف والرسائل من صفحة واحدة واضحة.' : 'Track CV requests, job updates, and messages from one clear notification center.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard"><Button variant="secondary"><FiSearch size={16} />{isAr ? 'العودة للوحة' : 'Back to Dashboard'}</Button></Link>
                <Button onClick={() => void markAllAsRead()} variant="secondary"><FiCheckCircle size={16} />{isAr ? 'تعليم الكل كمقروء' : 'Mark All Read'}</Button>
              </div>
            </div>
          </section>

          <Card hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">{isAr ? 'كل الإشعارات' : 'All Notifications'}</h2>
              <span className="text-sm text-[var(--foreground-secondary)]">{notifications.filter((item) => !item.read).length} {isAr ? 'غير مقروءة' : 'unread'}</span>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map((item) => <div key={item} className="h-24 rounded-2xl bg-[var(--background-secondary)] animate-pulse" />)
              ) : sortedNotifications.length === 0 ? (
                <div className="text-center py-16 text-[var(--foreground-secondary)]">
                  <FiBell size={40} className="mx-auto mb-4 opacity-50" />
                  <p>{isAr ? 'لا توجد إشعارات بعد' : 'No notifications yet'}</p>
                </div>
              ) : sortedNotifications.map((item) => (
                <div key={item.id} className={`rounded-2xl border px-4 py-4 ${item.read ? 'border-[var(--border)] bg-[var(--background-secondary)]/70' : 'border-[var(--primary-light)]/30 bg-[var(--primary)]/5'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 rounded-xl p-2 ${item.read ? 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)]' : 'bg-[var(--primary)]/10 text-[var(--primary-light)]'}`}>
                        {item.type === 'new_message' ? <FiMessageSquare size={16} /> : <FiBell size={16} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[var(--foreground)]">{item.title}</h3>
                          {!item.read && <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary-light)]" />}
                        </div>
                        <p className="text-sm text-[var(--foreground-secondary)] mt-1">{item.message}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {user.role === 'individual' && item.type === 'cv_request' && getCvRequestForNotification(item)?.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => void respondToCvRequest(item, 'approved')}>
                            <FiCheckCircle size={14} />
                            {isAr ? 'موافقة' : 'Approve'}
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => void respondToCvRequest(item, 'rejected')}>
                            <FiXCircle size={14} />
                            {isAr ? 'رفض' : 'Reject'}
                          </Button>
                        </>
                      )}
                      {!item.read && <Button variant="secondary" size="sm" onClick={() => void markAsRead(item.id)}>{isAr ? 'تعليم كمقروء' : 'Mark Read'}</Button>}
                      <Link href={getTargetLink(item)}><Button size="sm">{isAr ? 'فتح' : 'Open'}</Button></Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}