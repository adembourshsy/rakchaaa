// ============================================================
//  src/firebase/intrusCardsService.ts
//  Firestore service for L'INTRUS secret topics & words
//  Stored in the `intrus_topics` collection in Firestore.
// ============================================================

import { db } from './config';
import {
  collection,
  onSnapshot,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { IntrusTopic } from '../types';
import { INTRUS_TOPICS } from '../data/intrusTopics';

/** Fetch all Intrus topics from Firestore (with local fallback to INTRUS_TOPICS). */
export async function fetchIntrusTopics(): Promise<IntrusTopic[]> {
  try {
    const ref = collection(db, 'intrus_topics');
    const snap = await getDocs(ref);
    if (snap.empty) {
      return INTRUS_TOPICS;
    }
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title || '',
        category: data.category || 'places',
        icon: data.icon || '🕵️‍♂️',
        language: data.language || 'tn',
        isActive: data.isActive !== false,
        description: data.description || '',
      };
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.warn('[rakcha] fetchIntrusTopics fallback:', err?.message || err);
    return INTRUS_TOPICS;
  }
}

/** Real-time listener for L'INTRUS topics in Firestore. */
export function listenToIntrusTopics(callback: (topics: IntrusTopic[]) => void) {
  const ref = collection(db, 'intrus_topics');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.empty) {
        callback(INTRUS_TOPICS);
        return;
      }
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || '',
          category: data.category || 'places',
          icon: data.icon || '🕵️‍♂️',
          language: data.language || 'tn',
          isActive: data.isActive !== false,
          description: data.description || '',
        };
      });
      callback(list);
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.warn('[rakcha] listenToIntrusTopics error:', err.message);
      callback(INTRUS_TOPICS);
    }
  );
}

/** Add a new L'INTRUS topic to Firestore. */
export async function createIntrusTopicInFirestore(
  topicData: Omit<IntrusTopic, 'id'>,
  adminUid?: string
): Promise<IntrusTopic> {
  const topicId = `intrus-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const docRef = doc(db, 'intrus_topics', topicId);
  const now = new Date().toISOString();

  const payload = {
    ...topicData,
    id: topicId,
    isActive: topicData.isActive !== false,
    createdAt: now,
    updatedAt: now,
    createdBy: adminUid || 'admin_intrus',
  };

  await setDoc(docRef, payload);
  return { ...topicData, id: topicId, isActive: topicData.isActive !== false };
}

/** Update an existing L'INTRUS topic in Firestore. */
export async function updateIntrusTopicInFirestore(
  id: string,
  updates: Partial<IntrusTopic>,
  adminUid?: string
): Promise<void> {
  const docRef = doc(db, 'intrus_topics', id);
  const now = new Date().toISOString();

  const payload: Record<string, any> = {
    updatedAt: now,
    ...(adminUid ? { updatedBy: adminUid } : {}),
  };

  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.icon !== undefined) payload.icon = updates.icon;
  if (updates.language !== undefined) payload.language = updates.language;
  if (updates.isActive !== undefined) payload.isActive = updates.isActive;
  if (updates.description !== undefined) payload.description = updates.description;

  await updateDoc(docRef, payload);
}

/** Delete a L'INTRUS topic from Firestore. */
export async function deleteIntrusTopicInFirestore(id: string): Promise<void> {
  const docRef = doc(db, 'intrus_topics', id);
  await deleteDoc(docRef);
}
