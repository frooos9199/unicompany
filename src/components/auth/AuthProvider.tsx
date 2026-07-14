'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/lib/auth';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          return;
        }

        const profile = await getUserProfile(firebaseUser.uid);
        setUser(profile);
      } catch {
        if (firebaseUser) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
