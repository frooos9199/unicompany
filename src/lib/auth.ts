import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AppUser, UserRole } from '@/types';
import { getCvProfile } from './cvProfiles';

export interface RegisterUserResult {
  user: Awaited<ReturnType<typeof createUserWithEmailAndPassword>>['user'];
  verificationEmailSent: boolean;
}

export async function registerUser(
  email: string,
  password: string,
  role: UserRole,
  additionalData: Record<string, unknown>
): Promise<RegisterUserResult> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email,
    role,
    ...additionalData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    emailVerified: false,
    isActive: true,
  });

  let verificationEmailSent = false;
  try {
    await sendEmailVerification(user);
    verificationEmailSent = true;
  } catch {
    verificationEmailSent = false;
  }

  return { user, verificationEmailSent };
}

export async function loginUser(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function resendVerificationEmail() {
  if (!auth.currentUser) {
    throw new Error('No authenticated user available for verification email');
  }

  await sendEmailVerification(auth.currentUser);
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const profile = docSnap.data() as AppUser;
    if (profile.role === 'individual') {
      const cvProfile = await getCvProfile(uid);
      if (cvProfile) {
        return {
          ...profile,
          cvVisibility: cvProfile.cvVisibility,
          cvFile: cvProfile.cvFile,
          cvData: cvProfile.cvData,
          hasCv: Boolean(cvProfile.cvFile),
        } as AppUser;
      }
    }

    return profile;
  }
  return null;
}

export async function initializeSuperAdmins() {
  const superAdminEmails = ['summit_kw@hotmail.com', 'admin@unicompany.com'];

  for (const email of superAdminEmails) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, '1234');
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        role: 'superadmin',
        displayName: 'Super Admin',
        permissions: ['manage_users', 'manage_companies', 'manage_admins', 'view_analytics', 'manage_content', 'view_logs'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: true,
        isActive: true,
      });
    } catch {
      // User already exists
    }
  }
}
