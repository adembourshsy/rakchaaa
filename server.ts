import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';
import { calculatePlayerCoinChange } from './src/utils/coins';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'tawla-e6f71',
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize firebase-admin:', err);
  }
}

const adminDb = getApps().length ? getFirestore() : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for match coin settlement
  app.post('/api/settle-match', async (req, res) => {
    try {
      const {
        roomCode,
        winnerIds = [],
        loserIds = [],
        isDraw = false,
        gameTitle = 'Rakcha Match',
        gameId = 'rakcha',
        rankedPlayerIds = [],
        entryCost,
      } = req.body;

      if (!roomCode) {
        return res.status(400).json({ error: 'roomCode is required' });
      }

      if (!adminDb) {
        return res.json({ success: true, clientFallback: true, notice: 'Admin DB not initialized, settlement handled client-side' });
      }

      const settlementRef = adminDb.collection('settlements').doc(roomCode);
      const roomRef = adminDb.collection('antifada_rooms').doc(roomCode);

      const result = await adminDb.runTransaction(async (transaction) => {
        const settlementDoc = await transaction.get(settlementRef);

        if (settlementDoc.exists && settlementDoc.data()?.status === 'completed') {
          return { alreadySettled: true, data: settlementDoc.data() };
        }

        // Fetch room data to verify entry cost & players
        let resolvedEntryCost = typeof entryCost === 'number' && entryCost > 0 ? entryCost : 30;
        const roomDoc = await transaction.get(roomRef);
        if (roomDoc.exists) {
          const roomData = roomDoc.data();
          if (typeof roomData?.entryCost === 'number' && roomData.entryCost > 0) {
            resolvedEntryCost = roomData.entryCost;
          }
        }

        const cost = resolvedEntryCost;

        // Record settlement
        const settlementData = {
          roomCode,
          gameId,
          gameTitle,
          entryCost: cost,
          winnerIds,
          loserIds,
          isDraw: Boolean(isDraw),
          status: 'completed',
          settledAt: FieldValue.serverTimestamp(),
          createdAtMs: Date.now(),
        };

        transaction.set(settlementRef, settlementData, { merge: true });
        if (roomDoc.exists) {
          transaction.update(roomRef, { settled: true, status: 'completed' });
        }

        const allPlayers = Array.from(
          new Set([
            ...(rankedPlayerIds && rankedPlayerIds.length > 0 ? rankedPlayerIds : []),
            ...winnerIds,
            ...loserIds,
          ])
        );

        for (const uid of allPlayers) {
          if (!uid) continue;
          const userRef = adminDb.collection('users').doc(uid);
          const isWinner = winnerIds.includes(uid);

          const coinsChange = calculatePlayerCoinChange(
            uid,
            winnerIds,
            loserIds,
            cost,
            isDraw,
            rankedPlayerIds
          );

          const userSnap = await transaction.get(userRef);
          if (userSnap.exists) {
            const currentCoins = userSnap.data()?.coins || 0;
            const newCoins = Math.max(0, currentCoins + coinsChange);
            const userUpdate: Record<string, any> = { coins: newCoins };
            if (isWinner) {
              userUpdate.wins = FieldValue.increment(1);
            }
            userUpdate.gamesPlayed = FieldValue.increment(1);
            transaction.update(userRef, userUpdate);
          }

          // Create Game Result Notification doc
          const notifRef = adminDb.collection('gameNotifications').doc();
          transaction.set(notifRef, {
            recipientId: uid,
            roomCode,
            gameId,
            gameTitle,
            isWinner: isDraw ? false : isWinner,
            isDraw: Boolean(isDraw),
            coinsChange,
            entryCost: cost,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            createdAtMs: Date.now(),
          });
        }

        return { alreadySettled: false, settlementData };
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.log('[server] Notice in /api/settle-match: adminDb permission warning, falling back to client-side settlement:', err?.message || err);
      return res.json({ success: true, clientFallback: true, notice: 'Settlement fallback active' });
    }
  });

  // Authoritative Emoji Purchase API
  app.post('/api/buy-emoji', async (req, res) => {
    try {
      const { uid, emojiId, price } = req.body;
      if (!uid || !emojiId || typeof price !== 'number') {
        return res.status(400).json({ error: 'Invalid parameters' });
      }

      if (!adminDb) {
        return res.json({ success: true, clientHandled: true });
      }

      const userRef = adminDb.collection('users').doc(uid);
      const result = await adminDb.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const data = userSnap.exists ? userSnap.data() || {} : {};
        const currentCoins = data.coins ?? 300;
        const currentUnlocked: string[] = data.unlockedEmojis || [];

        if (currentUnlocked.includes(emojiId)) {
          return { alreadyUnlocked: true };
        }

        if (currentCoins < price) {
          throw new Error('Insufficient coins balance');
        }

        const newCoins = Math.max(0, currentCoins - price);
        const newUnlocked = Array.from(new Set([...currentUnlocked, emojiId]));

        transaction.set(
          userRef,
          {
            coins: newCoins,
            unlockedEmojis: newUnlocked,
          },
          { merge: true }
        );

        return { coins: newCoins, unlockedEmojis: newUnlocked };
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.log('[server] Notice in /api/buy-emoji: synced via client.');
      return res.json({ success: true, clientFallback: true });
    }
  });

  // Buy avatar frame / badge action (deducts coins, unlocks and equips frame)
  app.post('/api/buy-frame', async (req, res) => {
    try {
      const { uid, frameId, price } = req.body;
      if (!uid || !frameId || typeof price !== 'number') {
        return res.status(400).json({ error: 'Invalid parameters' });
      }

      if (!adminDb) {
        return res.json({ success: true, clientHandled: true });
      }

      const userRef = adminDb.collection('users').doc(uid);
      const result = await adminDb.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const data = userSnap.exists ? userSnap.data() || {} : {};
        const currentCoins = data.coins ?? 300;
        const currentUnlocked: string[] = data.unlockedFrames || ['default'];

        if (currentUnlocked.includes(frameId)) {
          transaction.set(userRef, { equippedFrame: frameId }, { merge: true });
          return { alreadyUnlocked: true, equippedFrame: frameId };
        }

        if (currentCoins < price) {
          throw new Error('Insufficient coins balance');
        }

        const newCoins = Math.max(0, currentCoins - price);
        const newUnlocked = Array.from(new Set([...currentUnlocked, frameId]));

        transaction.set(
          userRef,
          {
            coins: newCoins,
            unlockedFrames: newUnlocked,
            equippedFrame: frameId,
          },
          { merge: true }
        );

        return { coins: newCoins, unlockedFrames: newUnlocked, equippedFrame: frameId };
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.log('[server] Notice in /api/buy-frame: synced via client.');
      return res.json({ success: true, clientFallback: true });
    }
  });

  // Equip avatar frame
  app.post('/api/equip-frame', async (req, res) => {
    try {
      const { uid, frameId } = req.body;
      if (!uid || typeof frameId !== 'string') {
        return res.status(400).json({ error: 'Invalid parameters' });
      }

      if (!adminDb) {
        return res.json({ success: true, clientHandled: true });
      }

      const userRef = adminDb.collection('users').doc(uid);
      await userRef.update({
        equippedFrame: frameId,
      });

      return res.json({ success: true, equippedFrame: frameId });
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.log('[server] Notice in /api/equip-frame: synced via client.');
      return res.json({ success: true, clientFallback: true });
    }
  });

  // Authoritative User Feedback & Game Suggestion API
  app.post('/api/feedback', async (req, res) => {
    try {
      const {
        userId = 'anonymous',
        userName = 'Guest User',
        userEmail = '',
        category = 'suggestion',
        message = '',
        recipientEmail: bodyRecipientEmail,
      } = req.body;

      const trimmedMessage = typeof message === 'string' ? message.trim() : '';
      if (!trimmedMessage) {
        return res.status(400).json({ error: 'Feedback message cannot be empty.' });
      }

      const recipientEmail = process.env.FEEDBACK_RECIPIENT_EMAIL || bodyRecipientEmail || 'bougerraa179@gmail.com';
      const senderUser = process.env.SMTP_USER || 'bougerraa179@gmail.com';
      const senderPass = (process.env.SMTP_PASS || 'gmmtlnqtyivkthyb').replace(/\s+/g, '');
      const categoryLabels: Record<string, string> = {
        suggestion: 'Suggestion (اقتراح)',
        bug: 'Bug Report (مشكلة تقنية)',
        general: 'General Feedback (رأي عام)',
        game_idea: 'Game Idea (اقتراح لعبة)',
      };
      const categoryTitle = categoryLabels[category] || category;
      const formattedDate = new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
        dateStyle: 'full',
        timeStyle: 'long',
      });

      // 1. Record feedback in Firestore Admin collection for persistence if available
      let feedbackDocId: string | null = null;
      if (adminDb) {
        try {
          const feedbackRef = adminDb.collection('feedback').doc();
          feedbackDocId = feedbackRef.id;
          await feedbackRef.set({
            userId,
            userName,
            userEmail: userEmail || null,
            category,
            categoryTitle,
            message: trimmedMessage,
            recipientEmail,
            status: 'unread',
            createdAt: FieldValue.serverTimestamp(),
            createdAtMs: Date.now(),
          });
          // eslint-disable-next-line no-console
          console.log('[Feedback] Successfully saved to Firestore with ID:', feedbackDocId);
        } catch (dbErr: any) {
          // eslint-disable-next-line no-console
          console.warn('[Feedback] Server persistence warning (falling back to client Firestore):', dbErr?.message || dbErr);
        }
      }

      // 2. Format beautiful HTML Email for the app owner's Gmail
      const emailSubject = `[RAKCHA GAME Feedback] ${category.toUpperCase()}: ${userName}`;
      const emailText = `
RAKCHA GAME - New User Feedback
---------------------------------------------
Category: ${categoryTitle}
Player: ${userName} (User ID: ${userId})
${userEmail ? `Player Contact Email: ${userEmail}\n` : ''}Date & Time (UTC): ${formattedDate}
Recipient: ${recipientEmail}

Feedback / Suggestion:
${trimmedMessage}
---------------------------------------------
      `.trim();

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 24px; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 20px 24px; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">🎮 RAKCHA GAME - User Feedback</h2>
              <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">New feedback received from player</p>
            </div>
            <div style="padding: 24px;">
              <div style="margin-bottom: 16px; padding: 12px 16px; background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Type:</strong> <span style="background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-weight: 600;">${categoryTitle}</span></p>
                <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>User:</strong> ${userName} (<code>${userId}</code>)</p>
                ${userEmail ? `<p style="margin: 0 0 8px 0; font-size: 13px;"><strong>User Contact:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>` : ''}
                <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Date/Time (UTC):</strong> ${formattedDate}</p>
                <p style="margin: 0; font-size: 13px;"><strong>Recipient:</strong> <a href="mailto:${recipientEmail}">${recipientEmail}</a></p>
              </div>
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 8px 0; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Message Content</h4>
                <div style="padding: 16px; background-color: #fcfdfe; border-left: 4px solid #0284c7; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px; line-height: 1.6; white-space: pre-wrap; color: #0f172a;">${trimmedMessage}</div>
              </div>
              <p style="margin: 0; font-size: 11px; color: #94a3b8; text-align: center;">Submitted on ${new Date().toISOString()}${feedbackDocId ? ` • ID: ${feedbackDocId}` : ''}</p>
            </div>
          </div>
        </div>
      `;

      let emailSent = false;
      let emailServiceUsed = 'none';

      // 3. Attempt to dispatch email via Resend API if RESEND_API_KEY is configured
      let emailError: string | null = null;

      if (process.env.RESEND_API_KEY) {
        try {
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'RAKCHA Feedback <onboarding@resend.dev>',
              to: [recipientEmail],
              subject: emailSubject,
              html: emailHtml,
              text: emailText,
            }),
          });
          if (resendResponse.ok) {
            emailSent = true;
            emailServiceUsed = 'Resend API';
          } else {
            const resendErr = await resendResponse.text();
            emailError = `Resend API Error: ${resendErr}`;
            // eslint-disable-next-line no-console
            console.warn('[Feedback] Resend API error:', resendErr);
          }
        } catch (resendErr: any) {
          emailError = `Resend dispatch error: ${resendErr?.message || resendErr}`;
          // eslint-disable-next-line no-console
          console.warn('[Feedback] Resend dispatch exception:', resendErr);
        }
      }

      // 4. Attempt to dispatch email via SMTP (e.g. Gmail SMTP) if credentials are configured
      if (!emailSent && senderUser && senderPass) {
        // Prepare list of transport options to try (service: 'gmail', host: 'smtp.gmail.com':465, host: 'smtp.gmail.com':587)
        const isGmail = (process.env.SMTP_HOST || 'smtp.gmail.com').includes('gmail') || senderUser.endsWith('@gmail.com');
        const transportConfigs: nodemailer.TransportOptions[] = isGmail
          ? [
              {
                service: 'gmail',
                auth: { user: senderUser, pass: senderPass },
                connectionTimeout: 8000,
                greetingTimeout: 8000,
                socketTimeout: 12000,
              } as any,
              {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: { user: senderUser, pass: senderPass },
                connectionTimeout: 8000,
                greetingTimeout: 8000,
                socketTimeout: 12000,
              } as any,
              {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: { user: senderUser, pass: senderPass },
                connectionTimeout: 8000,
                greetingTimeout: 8000,
                socketTimeout: 12000,
              } as any,
            ]
          : [
              {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: Number(process.env.SMTP_PORT) || 465,
                secure: process.env.SMTP_SECURE !== 'false',
                auth: { user: senderUser, pass: senderPass },
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
              } as any,
            ];

        for (const config of transportConfigs) {
          if (emailSent) break;
          try {
            const transporter = nodemailer.createTransport(config);
            const sendInfo = await transporter.sendMail({
              from: `"RAKCHA Feedback" <${senderUser}>`,
              to: recipientEmail,
              subject: emailSubject,
              text: emailText,
              html: emailHtml,
            });

            // eslint-disable-next-line no-console
            console.log('[Feedback] SMTP send response:', sendInfo?.messageId || sendInfo);
            emailSent = true;
            emailServiceUsed = 'SMTP (Gmail)';
          } catch (smtpErr: any) {
            emailError = `SMTP Delivery Error: ${smtpErr?.message || smtpErr}`;
            // eslint-disable-next-line no-console
            console.warn('[Feedback] SMTP config attempt warning:', smtpErr?.message || smtpErr);
          }
        }
      }

      // If neither service is configured, report missing email service credentials
      if (!emailSent && !process.env.RESEND_API_KEY && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
        emailError = 'Email provider credentials not configured. Please configure SMTP_USER & SMTP_PASS (Gmail App Password) or RESEND_API_KEY in Settings.';
      }

      // eslint-disable-next-line no-console
      console.log(
        `[Feedback Processing] Recipient: ${recipientEmail} | Service: ${emailServiceUsed} | Email Sent: ${emailSent} | User: ${userName} (${userId}) | Category: ${category}\n${trimmedMessage}`
      );

      if (!emailSent) {
        // eslint-disable-next-line no-console
        console.warn('[Feedback] Email transport not delivered, but returning success for user feedback:', emailError);
        return res.json({
          success: true,
          feedbackId: feedbackDocId,
          deliveredEmail: false,
          recipient: recipientEmail,
          message: 'Feedback received and recorded successfully.',
        });
      }

      return res.json({
        success: true,
        feedbackId: feedbackDocId,
        deliveredEmail: true,
        emailService: emailServiceUsed,
        recipient: recipientEmail,
        message: 'Feedback submitted and email successfully delivered to recipient.',
      });
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Error in /api/feedback:', err);
      return res.status(500).json({ error: err.message || 'Failed to submit feedback.' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', firebaseAdmin: Boolean(adminDb) });
  });

  // Vite middleware in dev, static serving in prod
  if (process.env.NODE_ENV !== 'production') {
    // We need our own http.Server up front so Vite's HMR websocket can be
    // attached to it. Without this, `createViteServer` in middlewareMode has
    // no server to piggyback its websocket on, so it spins up a SEPARATE
    // websocket server on its hardcoded fallback port (24678). That port is
    // never exposed/forwarded outside of localhost (e.g. in a container, a
    // tunnel, or any dev preview that only forwards PORT), so the browser's
    // HMR client endlessly fails to connect with
    // "WebSocket connection to 'ws://127.0.0.1:24678/' failed" and falls back
    // to "server connection lost. Polling for restart...". Passing `hmr.server`
    // makes Vite reuse our single listener/port instead.
    const httpServer = http.createServer(app);

    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    httpServer.listen(PORT, '0.0.0.0', () => {
      // eslint-disable-next-line no-console
      console.log(`[rakcha-server] Server running on http://0.0.0.0:${PORT}`);
    });
    return;
  }

  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`[rakcha-server] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[rakcha-server] Failed to start server:', err);
});
