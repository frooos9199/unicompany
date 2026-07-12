'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/lib/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { UserProfile } from '@/types';

export default function AuthInitializer() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser((profile as UserProfile | null) ?? null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [setLoading, setUser]);

  return null;
}