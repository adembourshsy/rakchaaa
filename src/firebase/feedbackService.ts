import { db, auth } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

export interface FeedbackData {
  userId: string;
  userName: string;
  userEmail?: string;
  category: string;
  categoryTitle?: string;
  message: string;
  recipientEmail?: string;
}

// EmailJS sends the email directly from the client (web or native app) —
// it does not depend on server.ts being reachable, which is what makes it
// work from the phone build (Capacitor's WebView has no server of its own
// to call a relative '/api/feedback' against).
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

export async function submitFeedback(feedback: FeedbackData): Promise<{ success: boolean; id?: string; message?: string }> {
  let clientDocId: string | undefined;
  let clientSuccess = false;
  let serverSuccess = false;
  let serverFeedbackId: string | undefined;
  let lastError = '';

  // 1. Direct Client-side Firestore submission
  try {
    const docRef = await addDoc(collection(db, 'feedback'), {
      userId: feedback.userId || auth.currentUser?.uid || 'anonymous',
      userName: feedback.userName || 'Player',
      userEmail: feedback.userEmail || auth.currentUser?.email || null,
      category: feedback.category,
      categoryTitle: feedback.categoryTitle || feedback.category,
      message: feedback.message,
      recipientEmail: feedback.recipientEmail || 'bougerraa179@gmail.com',
      status: 'unread',
      createdAt: serverTimestamp(),
      createdAtMs: Date.now(),
    });
    clientDocId = docRef.id;
    clientSuccess = true;
    // eslint-disable-next-line no-console
    console.log('[Feedback] Client Firestore save success:', clientDocId);
  } catch (clientErr: any) {
    // eslint-disable-next-line no-console
    console.warn('[Feedback] Client firestore save warning:', clientErr?.message || clientErr);
    lastError = clientErr?.message || '';
  }

  // 2. Send email directly via EmailJS — works identically on web and on the
  // native phone app since it's a plain HTTPS call from the client, no
  // backend server required.
  if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: feedback.userName || 'Player',
          user_email: feedback.userEmail || '',
          category: feedback.categoryTitle || feedback.category,
          message: feedback.message,
          recipient_email: feedback.recipientEmail || 'bougerraa179@gmail.com',
        },
        { publicKey: EMAILJS_PUBLIC_KEY }
      );
      serverSuccess = true;
      // eslint-disable-next-line no-console
      console.log('[Feedback] EmailJS dispatch success');
    } catch (emailErr: any) {
      // eslint-disable-next-line no-console
      console.warn('[Feedback] EmailJS dispatch warning:', emailErr?.text || emailErr?.message || emailErr);
      if (!lastError) lastError = emailErr?.text || emailErr?.message || 'EmailJS dispatch failed.';
    }
  }

  // 3. Fallback: legacy backend server route (/api/feedback), only reachable
  // when server.ts is actually deployed and served from the same origin
  // (e.g. the web build). Harmless no-op on the native app.
  if (!serverSuccess) {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        serverSuccess = true;
        serverFeedbackId = data.feedbackId;
      } else {
        if (!lastError) lastError = data.error || 'Server rejected submission.';
      }
    } catch (serverErr: any) {
      // eslint-disable-next-line no-console
      console.warn('[Feedback] Server endpoint warning:', serverErr);
      if (!lastError) lastError = serverErr?.message || 'Network error.';
    }
  }

  if (clientSuccess || serverSuccess) {
    return { success: true, id: serverFeedbackId || clientDocId };
  }

  // Fallback: Save to localStorage so feedback is never lost on phone
  try {
    const localQueue = JSON.parse(localStorage.getItem('af_feedback_queue') || '[]');
    localQueue.push({ ...feedback, createdAtMs: Date.now() });
    localStorage.setItem('af_feedback_queue', JSON.stringify(localQueue));
    return { success: true, message: 'Saved locally' };
  } catch {
    // ignore
  }

  throw new Error(lastError || 'Could not send feedback. Please check your network connection.');
}
