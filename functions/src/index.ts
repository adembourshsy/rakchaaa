import { onSchedule } from "firebase-functions/v2/scheduler";
export * from "./mecanque";

import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Scheduled Cloud Function running every hour to clean up stale rooms inactive for 10 hours or more.
 * Uses server-side time, protects permanent user/game data, and safely handles subcollection deletion.
 */
export const cleanupStaleRooms = onSchedule(
  {
    schedule: "0 * * * *", // Runs every hour
    timeZone: "UTC",
  },
  async (event) => {
    const TEN_HOURS_MS = 10 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const thresholdTime = admin.firestore.Timestamp.fromMillis(nowMs - TEN_HOURS_MS);

    let deletedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    try {
      const roomsRef = db.collection("antifada_rooms");
      const q = roomsRef.where("lastActivityAt", "<", thresholdTime).limit(100);
      const snapshot = await q.get();

      if (snapshot.empty) {
        console.log("[cleanupStaleRooms] No stale rooms found.");
        return;
      }

      console.log(`[cleanupStaleRooms] Found ${snapshot.size} potentially stale rooms.`);

      for (const roomDoc of snapshot.docs) {
        const roomCode = roomDoc.id;
        const roomRef = roomDoc.ref;

        try {
          // Race Condition Protection: Re-read the room to ensure it hasn't become active concurrently
          const freshDoc = await roomRef.get();
          if (!freshDoc.exists) {
            continue; // Already deleted
          }

          const freshData = freshDoc.data();
          const lastActivityAt = freshData?.lastActivityAt;

          if (lastActivityAt && lastActivityAt.toMillis) {
            const lastActiveMs = lastActivityAt.toMillis();
            if (nowMs - lastActiveMs < TEN_HOURS_MS) {
              console.log(`[cleanupStaleRooms] Room ${roomCode} became active again. Skipping.`);
              skippedCount++;
              continue;
            }
          }

          // Delete room messages and document safely using recursiveDelete (handles subcollections automatically)
          if (db.recursiveDelete) {
            await db.recursiveDelete(roomRef);
          } else {
            // Fallback manual subcollection deletion if recursiveDelete is not available
            const messagesRef = roomRef.collection("messages");
            const messagesSnap = await messagesRef.get();
            const batch = db.batch();
            messagesSnap.docs.forEach((msgDoc) => {
              batch.delete(msgDoc.ref);
            });
            batch.delete(roomRef);
            await batch.commit();
          }

          deletedCount++;
          console.log(`[cleanupStaleRooms] Successfully deleted stale room ${roomCode} and its messages.`);
        } catch (roomErr) {
          skippedCount++;
          console.error(`[cleanupStaleRooms] Failed to delete room ${roomCode}:`, roomErr);
        }
      }

      console.log(`[cleanupStaleRooms] Finished. Deleted: ${deletedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`);
    } catch (err) {
      console.error("[cleanupStaleRooms] Critical error executing scheduled cleanup:", err);
    }
  }
);
