import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';

const envPath = resolve(process.cwd(), '.env.local');
const envLines = readFileSync(envPath, 'utf8').split('\n');

const env = Object.fromEntries(
  envLines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separatorIndex = line.indexOf('=');
      return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
    }),
);

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(auth, 'admin@unicompany.com', '123456');
await auth.authStateReady();
await auth.currentUser?.getIdToken(true);

await updateDoc(doc(db, 'users', 'debug_company'), {
  isActive: false,
  displayName: 'Debug Company (hidden)',
  updatedAt: new Date(),
});

await updateDoc(doc(db, 'jobs', 'debug_job'), {
  status: 'archived',
});

console.log('Debug seed documents hidden from public listings.');