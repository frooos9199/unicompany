import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/types';

export async function findOrCreateConversation(currentUser: AppUser, targetUser: AppUser) {
  const conversationsQuery = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', currentUser.uid),
  );

  const snapshot = await getDocs(conversationsQuery);
  const existing = snapshot.docs.find((docSnapshot) => {
    const participants = (docSnapshot.data().participants ?? []) as string[];
    return participants.includes(targetUser.uid);
  });

  if (existing) {
    return existing.id;
  }

  const created = await addDoc(collection(db, 'conversations'), {
    participants: [currentUser.uid, targetUser.uid],
    participantNames: [currentUser.displayName, targetUser.displayName],
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  return created.id;
}