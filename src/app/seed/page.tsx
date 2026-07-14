'use client';

import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function SeedPage() {
  const [status, setStatus] = useState<string[]>([]);

  const createAdmin = async (email: string, password: string) => {
    // Try to sign in first
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // If sign in works, just update Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email,
        role: 'superadmin',
        displayName: 'Super Admin',
        permissions: ['manage_users', 'manage_companies', 'manage_admins', 'view_analytics', 'manage_content', 'view_logs'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: true,
        isActive: true,
      });
      return `✅ ${email} - تسجيل دخول ناجح + تحديث Firestore`;
    } catch {
      // Sign in failed, try to create new account
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          email,
          role: 'superadmin',
          displayName: 'Super Admin',
          permissions: ['manage_users', 'manage_companies', 'manage_admins', 'view_analytics', 'manage_content', 'view_logs'],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          emailVerified: true,
          isActive: true,
        });
        return `✅ ${email} - تم إنشاء حساب جديد`;
      } catch (error: unknown) {
        if (error instanceof FirebaseError) {
          return `❌ ${email} - ${error.code}: ${error.message}`;
        }

        return `❌ ${email} - Unknown error`;
      }
    }
  };

  useEffect(() => {
    const seedAdmins = async () => {
      const result1 = await createAdmin('summit_kw@hotmail.com', '123456');
      setStatus((prev) => [...prev, result1]);

      const result2 = await createAdmin('admin@unicompany.com', '123456');
      setStatus((prev) => [...prev, result2]);
    };

    void seedAdmins();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
      <div className="max-w-lg w-full bg-gray-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-6">🔧 Super Admin Setup</h1>
        <div className="space-y-3">
          {status.length === 0 ? (
            <p className="text-gray-400">جاري المعالجة...</p>
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
