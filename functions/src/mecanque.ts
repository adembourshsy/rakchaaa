import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

// ----------------------------------------------------------------------------
// startMecanqueGame
// ----------------------------------------------------------------------------
export const startMecanqueGame = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError("unauthenticated", "User must be authenticated.");

  const { roomCode, difficulty = "beginner", carCount = 5, thinkingTime = 30 } = data;
  if (!roomCode) throw new HttpsError("invalid-argument", "Missing roomCode.");

  // 1. Validate Room & Host
  const roomRef = db.collection("antifada_rooms").doc(roomCode);
  const roomSnap = await roomRef.get();
  if (!roomSnap.exists) throw new HttpsError("not-found", "Room not found.");
  
  const roomData = roomSnap.data();
  if (roomData?.hostId !== auth.uid) {
    throw new HttpsError("permission-denied", "Only host can start the game.");
  }

  // 2. Load cars from master DB
  const carsSnap = await db.collection("mecanque_cars").get();
  let allCars = carsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  
  // 3. Filter by difficulty
  let filteredCars = allCars;
  if (difficulty === 'beginner') filteredCars = allCars.filter(c => c.difficulty === 'beginner' || !c.difficulty);
  if (difficulty === 'intermediate') filteredCars = allCars.filter(c => c.difficulty === 'intermediate');
  if (difficulty === 'expert') filteredCars = allCars.filter(c => c.difficulty === 'expert');
  if (filteredCars.length === 0) filteredCars = allCars;

  // 4. Shuffle and select
  for (let i = filteredCars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filteredCars[i], filteredCars[j]] = [filteredCars[j], filteredCars[i]];
  }
  const selectedCars = filteredCars.slice(0, carCount);

  // 5. Separate public/private data
  const privateCars = selectedCars.map(c => ({ ...c }));
  const publicCars = selectedCars.map(c => {
    const { acceptedAnswers, ...rest } = c; // Strip answers
    return rest;
  });

  const timerEndTime = Date.now() + thinkingTime * 1000;

  const initialScores: Record<string, number> = {};
  const players = roomData?.players || [];
  players.forEach((p: any) => {
    initialScores[p.id] = 0;
  });

  const publicState = {
    engineVersion: 2,
    status: 'playing',
    phase: 'answering',
    phaseUpdatedAt: Date.now(),
    difficulty,
    carCount,
    thinkingTime,
    currentCarIndex: 0,
    timerEndTime,
    cars: publicCars, // Sanitzed!
    answersMap: {},
    submittedPlayerIds: [],
    revealedAnswers: [],
    validatedPlayerIds: [],
    scores: initialScores,
    winner: null,
  };

  // 6. Write public state & private state
  const publicGameRef = db.collection("antifada_games").doc(roomCode);
  const privateGameRef = db.collection("antifada_games_private").doc(roomCode);

  const batch = db.batch();
  batch.set(publicGameRef, publicState);
  batch.set(privateGameRef, { cars: privateCars });
  await batch.commit();

  return { success: true };
});

// ----------------------------------------------------------------------------
// submitMecanqueGuess
// ----------------------------------------------------------------------------
export const submitMecanqueGuess = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError("unauthenticated", "User must be authenticated.");

  const { roomCode, guessText, currentCarIndex } = data;
  if (!roomCode || guessText === undefined || currentCarIndex === undefined) {
    throw new HttpsError("invalid-argument", "Missing roomCode, guessText, or currentCarIndex.");
  }
  
  const trimmedGuess = String(guessText).trim();

  const publicGameRef = db.collection("antifada_games").doc(roomCode);
  const privateGameRef = db.collection("antifada_games_private").doc(roomCode);
  const roomRef = db.collection("antifada_rooms").doc(roomCode);

  return db.runTransaction(async (transaction) => {
    const [publicSnap, privateSnap, roomSnap] = await Promise.all([
      transaction.get(publicGameRef),
      transaction.get(privateGameRef),
      transaction.get(roomRef)
    ]);

    if (!publicSnap.exists || !privateSnap.exists || !roomSnap.exists) {
      throw new HttpsError("not-found", "Game or Room not found.");
    }

    const publicState = publicSnap.data() as any;
    const privateState = privateSnap.data() as any;
    const roomState = roomSnap.data() as any;

    // Validate player is in room
    const isPlayer = roomState.players?.some((p: any) => p.id === auth.uid);
    if (!isPlayer) throw new HttpsError("permission-denied", "Player not in room.");

    // Validate Phase
    if (publicState.status !== 'playing' || publicState.phase !== 'answering') {
      throw new HttpsError("failed-precondition", "Not currently in answering phase.");
    }

    // Validate Car Index
    if (publicState.currentCarIndex !== currentCarIndex) {
      throw new HttpsError("failed-precondition", "Car index mismatch.");
    }

    // Validate Timer (with 2000ms grace period)
    const now = Date.now();
    if (publicState.timerEndTime && now > publicState.timerEndTime + 2000) {
      throw new HttpsError("failed-precondition", "Time expired for this round.");
    }

    // Idempotency: Has player already submitted?
    if ((publicState.submittedPlayerIds || []).includes(auth.uid)) {
      return { success: false, reason: 'already_submitted' }; // Safely abort
    }

    // Validate Guess
    const carData = privateState.cars?.[currentCarIndex];
    if (!carData) throw new HttpsError("internal", "Private car data missing.");

    const acceptedAnswers = carData.acceptedAnswers || [];
    const cleanUser = trimmedGuess.toLowerCase().replace(/[^a-z0-9]/g, '');
    let isCorrect = false;

    if (cleanUser.length > 0) {
        isCorrect = acceptedAnswers.some((acc: string) => {
            const cleanAcc = acc.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanUser === cleanAcc || cleanUser.includes(cleanAcc) || cleanAcc.includes(cleanUser);
        });
    }

    // Get Player Profile Details
    const playerProf = roomState.players.find((p: any) => p.id === auth.uid);

    // Update State
    const answersMap = publicState.answersMap || {};
    answersMap[auth.uid] = {
      playerId: auth.uid,
      playerName: playerProf.name,
      playerAvatar: playerProf.avatarUrl,
      text: trimmedGuess,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCorrect: isCorrect,
    };

    const submittedPlayerIds = Object.keys(answersMap);
    const revealedAnswers = Object.values(answersMap);
    
    // Increment Score if correct
    const scores = publicState.scores || {};
    if (isCorrect) {
      scores[auth.uid] = (scores[auth.uid] || 0) + 5;
    }

    // Auto-advance if everyone submitted
    const isEveryoneDone = submittedPlayerIds.length >= (roomState.players?.length || 1);
    
    let nextPhase = publicState.phase;
    let finalRevealed = revealedAnswers;
    let phaseUpdatedAt = publicState.phaseUpdatedAt || Date.now();

    if (isEveryoneDone) {
      nextPhase = 'reveal';
      phaseUpdatedAt = Date.now();
      // Fill missing real players with "noAnswer" just in case
      finalRevealed = roomState.players.map((p: any) => {
        const existing = answersMap[p.id];
        if (existing) return existing;
        return {
          playerId: p.id,
          playerName: p.name,
          playerAvatar: p.avatarUrl,
          text: 'Aucune réponse',
          noAnswer: true,
          isCorrect: false,
        };
      });
    }

    transaction.update(publicGameRef, {
      answersMap,
      submittedPlayerIds,
      revealedAnswers: finalRevealed,
      scores,
      phase: nextPhase,
      phaseUpdatedAt
    });

    return { success: true, isCorrect, nextPhase };
  });
});

// ----------------------------------------------------------------------------
// advanceMecanqueRound
// ----------------------------------------------------------------------------
export const advanceMecanqueRound = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError("unauthenticated", "User must be authenticated.");

  const { roomCode, action } = data; // action = 'timeout' or 'next_car'
  if (!roomCode) throw new HttpsError("invalid-argument", "Missing roomCode.");

  const publicGameRef = db.collection("antifada_games").doc(roomCode);
  const roomRef = db.collection("antifada_rooms").doc(roomCode);

  return db.runTransaction(async (transaction) => {
    const [publicSnap, roomSnap] = await Promise.all([
      transaction.get(publicGameRef),
      transaction.get(roomRef)
    ]);

    if (!publicSnap.exists || !roomSnap.exists) {
      throw new HttpsError("not-found", "Game or Room not found.");
    }

    const publicState = publicSnap.data() as any;
    const roomState = roomSnap.data() as any;
    
    const isPlayer = roomState.players?.some((p: any) => p.id === auth.uid);
    if (!isPlayer) throw new HttpsError("permission-denied", "Player not in room.");

    // Check if host
    const isHost = (roomState.hostId === auth.uid);

    if (action === 'timeout') {
      if (publicState.phase !== 'answering') return { success: false, reason: 'not_answering_phase' };
      
      // Allow transition to reveal if timer is expired OR caller is host
      const now = Date.now();
      const isExpired = publicState.timerEndTime && now >= publicState.timerEndTime;
      if (!isExpired && !isHost) {
          throw new HttpsError("permission-denied", "Timer not expired and not host.");
      }

      const answersMap = publicState.answersMap || {};
      const finalRevealed = roomState.players.map((p: any) => {
        const existing = answersMap[p.id];
        if (existing) return existing;
        return {
          playerId: p.id,
          playerName: p.name,
          playerAvatar: p.avatarUrl,
          text: 'Aucune réponse',
          noAnswer: true,
          isCorrect: false,
        };
      });

      transaction.update(publicGameRef, {
        phase: 'reveal',
        revealedAnswers: finalRevealed,
        phaseUpdatedAt: Date.now()
      });

      return { success: true, newPhase: 'reveal' };

    } else if (action === 'validate') {
      if (publicState.phase !== 'reveal') return { success: false, reason: 'not_reveal_phase' };
      
      const phaseUpdatedAt = publicState.phaseUpdatedAt || 0;
      if (Date.now() < phaseUpdatedAt + 5000) {
        throw new HttpsError("failed-precondition", "Must wait 5 seconds before advancing phase.");
      }

      transaction.update(publicGameRef, {
        phase: 'validation',
        phaseUpdatedAt: Date.now()
      });
      return { success: true, newPhase: 'validation' };

    } else if (action === 'next_car') {
      if (publicState.phase !== 'validation' && publicState.phase !== 'reveal') return { success: false, reason: 'not_validation_phase' };

      const phaseUpdatedAt = publicState.phaseUpdatedAt || 0;
      if (Date.now() < phaseUpdatedAt + 5000) {
        throw new HttpsError("failed-precondition", "Must wait 5 seconds before advancing phase.");
      }

      const nextIndex = (publicState.currentCarIndex || 0) + 1;
      const isMatchEnded = nextIndex >= (publicState.cars?.length || 0);
      
      const updatedScores = publicState.scores || {};

      if (isMatchEnded) {
        // Calculate Winner & Ties
        let highestScore = -1;
        roomState.players.forEach((p: any) => {
          const s = updatedScores[p.id] || 0;
          if (s > highestScore) {
            highestScore = s;
          }
        });

        const tiedPlayers = roomState.players.filter((p: any) => (updatedScores[p.id] || 0) === highestScore);
        const winnerIds = tiedPlayers.map((p: any) => p.id);

        let matchResult = 'draw';
        let finalWinner = null;

        if (tiedPlayers.length === 1) {
          matchResult = 'winner';
          finalWinner = { playerId: tiedPlayers[0].id, playerName: tiedPlayers[0].name, score: highestScore };
        }

        transaction.update(publicGameRef, {
          status: 'ended',
          phase: 'ended',
          matchResult,
          winnerIds,
          winner: finalWinner,
          phaseUpdatedAt: Date.now()
        });

        return { success: true, newPhase: 'ended' };
      } else {
        const timerEndTime = Date.now() + publicState.thinkingTime * 1000;
        transaction.update(publicGameRef, {
          currentCarIndex: nextIndex,
          phase: 'answering',
          timerEndTime,
          answersMap: {},
          submittedPlayerIds: [],
          revealedAnswers: [],
          validatedPlayerIds: [],
          phaseUpdatedAt: Date.now()
        });

        return { success: true, newPhase: 'answering' };
      }
    }
    
    throw new HttpsError("invalid-argument", "Invalid action.");
  });
});
