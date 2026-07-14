import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Timestamp, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

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

if (!auth.currentUser) {
  throw new Error('Admin authentication failed.');
}

const uid = auth.currentUser.uid;
const now = Timestamp.now();

const profileSnapshot = await getDoc(doc(db, 'users', uid));
console.log('Authenticated UID:', uid);
console.log('Profile exists:', profileSnapshot.exists());
console.log('Profile data:', profileSnapshot.data());

const checks = [
  ['notifications', 'debug_notification', { userId: uid, type: 'new_message', title: 'debug', message: 'debug', read: false, createdAt: now }],
  ['cvRequests', 'debug_cv_request', { companyId: uid, individualId: uid, status: 'pending', message: 'debug', createdAt: now, updatedAt: now }],
  ['users', 'debug_company', { uid: 'debug_company', email: 'debug@example.com', role: 'company', displayName: 'Debug Company', companyName: 'Debug Company', isActive: true, createdAt: now, updatedAt: now }],
  ['jobs', 'debug_job', { id: 'debug_job', title: 'Debug Job', description: 'debug', companyId: 'debug_company', companyName: 'Debug Company', status: 'active', createdAt: now }],
  ['applications', 'debug_application', { id: 'debug_application', jobId: 'debug_job', applicantId: 'debug_individual', applicantName: 'Debug User', status: 'pending', createdAt: now }],
  ['conversations', 'debug_conversation', { participants: ['debug_company', 'debug_individual'], participantNames: ['Debug Company', 'Debug User'], lastMessage: 'debug', lastMessageAt: now, createdAt: now }],
  ['messages', 'debug_message', { conversationId: 'debug_conversation', senderId: 'debug_company', content: 'debug', createdAt: now, read: false }],
];

for (const [collectionName, id, payload] of checks) {
  try {
    await setDoc(doc(db, collectionName, id), payload);
    console.log(`PASS ${collectionName}`);
  } catch (error) {
    console.error(`FAIL ${collectionName}`, error.code || error.message || error);
  }
}