'use client';

import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function SeedPage() {
  const [status, setStatus] = useState<string[]>([]);

  useEffect(() => {
    seedAdmins();
  }, []);

  const seedAdmins = async () => {
    const admins = [
      { email: 'summit_kw@hotmail.com', password: '123456' },
      { email: 'admin@unicompany.com', password: '123456' },
    ];

    for (const admin of admins) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, admin.email, admin.password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: admin.email,
          role: 'superadmin',
          displayName: 'Super Admin',
          permissions: ['manage_users', 'manage_companies', 'manage_admins', 'view_analytics', 'manage_content', 'view_logs'],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          emailVerified: true,
          isActive: true,
        });
        setStatus(prev => [...prev, `✅ ${admin.email} - تم تحديث الحساب بنجاح`]);
      } catch (error: any) {
        setStatus(prev => [...prev, `❌ ${admin.email} - خطأ: ${error.code} - ${error.message}`]);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
      <div className="max-w-lg w-full bg-gray-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-6">🔧 تحديث حسابات Super Admin</h1>
        <div className="space-y-3">
          {status.length === 0 ? (
            <p className="text-gray-400">جاري التحديث...</p>
          ) : (
            status.map((s, i) => (
              <p key={i} className="text-sm">{s}</p>
            ))
          )}
        </div>
        <p className="mt-6 text-xs text-gray-500">⚠️ احذف هذه الصفحة بعد الاستخدام</p>
      </div>
    </div>
  );
}
