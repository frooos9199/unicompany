import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

function sanitizeEnvValue(value?: string) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return normalizedValue;
  }

  return normalizedValue.replace(/^['"]|['"]$/g, '');
}

const firebaseConfig = {
  apiKey: sanitizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: sanitizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: sanitizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: sanitizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
