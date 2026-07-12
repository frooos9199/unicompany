import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserRole } from '@/types';

export async function registerUser(
  email: string,
  password: string,
  role: UserRole,
  additionalData: Record<string, unknown>
) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await sendEmailVerification(user);

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

  return user;
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

export async function getUserProfile(uid: string) {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
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
