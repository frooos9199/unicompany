import { deleteField, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { CVProfile } from '@/types';

export function getCvRequestId(companyId: string, individualId: string) {
  return `${companyId}_${individualId}`;
}

export async function getCvProfile(userId: string): Promise<CVProfile | null> {
  const snapshot = await getDoc(doc(db, 'cvProfiles', userId));
  if (!snapshot.exists()) {
    return null;
  }

  return { userId: snapshot.id, ...snapshot.data() } as CVProfile;
}

export async function saveCvProfile(userId: string, profile: Pick<CVProfile, 'cvVisibility' | 'cvFile' | 'cvData'>) {
  const existingSnapshot = await getDoc(doc(db, 'cvProfiles', userId));

  await setDoc(
    doc(db, 'cvProfiles', userId),
    {
      userId,
      cvVisibility: profile.cvVisibility,
      cvFile: profile.cvFile || deleteField(),
      cvData: profile.cvData || deleteField(),
      hasCv: Boolean(profile.cvFile),
      createdAt: existingSnapshot.exists() ? existingSnapshot.data().createdAt ?? serverTimestamp() : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function scrubLegacyCvFields(userId: string, hasCv: boolean) {
  await updateDoc(doc(db, 'users', userId), {
    hasCv,
    cvFile: deleteField(),
    cvData: deleteField(),
    updatedAt: serverTimestamp(),
  });
}