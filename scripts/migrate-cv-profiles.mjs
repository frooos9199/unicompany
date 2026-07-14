import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, deleteField, doc, getDocs, getFirestore, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';

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

if (!auth.currentUser) {
  throw new Error('Admin user is not authenticated for Firestore writes.');
}

await auth.currentUser.getIdToken(true);

const individualUsersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'individual')));

for (const userSnapshot of individualUsersSnapshot.docs) {
  const data = userSnapshot.data();
  const cvVisibility = data.cvVisibility || 'request_only';
  const cvFile = data.cvFile;
  const cvData = data.cvData;
  const hasCv = Boolean(cvFile);

  if (cvFile || cvData) {
    await setDoc(doc(db, 'cvProfiles', userSnapshot.id), {
      userId: userSnapshot.id,
      cvVisibility,
      cvFile,
      cvData,
      createdAt: data.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  await updateDoc(doc(db, 'users', userSnapshot.id), {
    cvVisibility,
    hasCv,
    cvFile: deleteField(),
    cvData: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

const cvRequestsSnapshot = await getDocs(collection(db, 'cvRequests'));

for (const requestSnapshot of cvRequestsSnapshot.docs) {
  const data = requestSnapshot.data();
  if (!data.companyId || !data.individualId) {
    continue;
  }

  const deterministicId = `${data.companyId}_${data.individualId}`;
  if (requestSnapshot.id === deterministicId) {
    continue;
  }

  const batch = writeBatch(db);
  batch.set(doc(db, 'cvRequests', deterministicId), {
    id: deterministicId,
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.delete(doc(db, 'cvRequests', requestSnapshot.id));
  await batch.commit();
}

console.log('CV profile migration complete.');