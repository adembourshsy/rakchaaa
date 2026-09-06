import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  LogOut,
  Volume2,
  Send,
  Trophy,
  CheckCircle2,
  Gauge,
  RefreshCw,
  Clock,
  Check,
  X,
  Lock,
  Eye,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getThemeById } from '../../theme/gameThemeEngine';
import { CarData, MecanqueGameState, MecanqueRevealedAnswer } from '../../types';
import { getCarsByDifficulty } from '../../data/carData';
import { fetchMecanqueCarsFromFirestore } from '../../firebase/mecanqueCardsService';
import { startMecanqueGame, submitMecanqueGuess, advanceMecanqueRound } from '../../firebase/mecanqueFunctions';
import { playEngineRevSound } from '../../utils/engineSound';
import { useGameFinishedAd } from '../../hooks/useGameFinishedAd';
import { useGameState } from '../../hooks/useGameState';

const MecanqueGameViewComponent: React.FC = () => {
  const { joinedRoom, userProfile, currentUid, requestLeaveRoom, mecanqueSettings, soundEnabled, settleMatchCoins, selectedGameTheme, setIsThemePickerOpen, batterySaver } = useApp();
  const currentLeagueTheme = getThemeById(selectedGameTheme, userProfile?.level || 1);

  const myPlayerId = currentUid || userProfile.id || '';
  const activeSetup = joinedRoom?.mecanqueSettings || mecanqueSettings;

  // Saved room settings
  const difficulty = activeSetup?.difficulty || 'beginner';
  const carCount = activeSetup?.carCount || 5;
  const thinkingTime = activeSetup?.thinkingTime || 30;

  // Authoritative Game State
  const [gameState, setGameState] = useGameState<MecanqueGameState>(joinedRoom?.code || '', {
    status: 'setup',
    phase: 'setup',
    difficulty,
    carCount,
    thinkingTime,
    currentCarIndex: 0,
    timerEndTime: 0,
    cars: [],
    submittedPlayerIds: [],
    revealedAnswers: [],
    validatedPlayerIds: [],
    scores: {},
    winner: null,
  });

  const [inputAnswer, setInputAnswer] = useState('');
  const [hasSubmittedLocal, setHasSubmittedLocal] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState<number>(30);
  const [validationMap, setValidationMap] = useState<Record<string, boolean>>({});

  const isHost = Boolean(myPlayerId && (joinedRoom?.hostId === myPlayerId || joinedRoom?.hostId === userProfile.id));
  const realPlayers = joinedRoom?.players || [];
  const currentCar: CarData | undefined = (gameState.cars || [])[gameState.currentCarIndex];

  // Show preloaded interstitial on game finish
  useGameFinishedAd(gameState.status === 'ended' || gameState.phase === 'ended');

  // Trigger coin settlement on Mecanque match completion
  const hasSettledMecanqueRef = useRef(false);
  useEffect(() => {
    if ((gameState.status === 'ended' || gameState.phase === 'ended') && gameState.winner && !hasSettledMecanqueRef.current) {
      hasSettledMecanqueRef.current = true;
      const winnerId = gameState.winner.playerId;
      const winnerIds = winnerId ? [winnerId] : [];
      const loserIds = realPlayers.filter((p) => p.id !== winnerId).map((p) => p.id);

      settleMatchCoins(
        joinedRoom?.code || 'mecanque_match',
        joinedRoom?.gameTitle || 'Mecanque 🏎️',
        winnerIds,
        loserIds,
        joinedRoom?.entryCost || 30,
        false
      );
    } else if (gameState.status !== 'ended' && gameState.phase !== 'ended') {
      hasSettledMecanqueRef.current = false;
    }
  }, [gameState.status, gameState.phase, gameState.winner, realPlayers, joinedRoom?.code, joinedRoom?.gameTitle, joinedRoom?.entryCost, settleMatchCoins]);

  // Start Game handler (Host only) - Calls backend function with client-side fallback
  const handleStartGame = useCallback(async () => {
    try {
      await startMecanqueGame({
        roomCode: joinedRoom?.code,
        difficulty,
        carCount,
        thinkingTime,
      });
    } catch (err) {
      console.warn("[rakcha] Failed to start Mecanque game via backend, executing client-side fallback:", err);
      try {
        const allCars = await fetchMecanqueCarsFromFirestore();
        const filtered = allCars.filter((c) => c.difficulty === difficulty);
        const sourceList = filtered.length >= carCount ? filtered : allCars;
        const shuffled = [...sourceList].sort(() => Math.random() - 0.5).slice(0, carCount);

        setGameState({
          status: 'in_progress',
          phase: 'answering',
          difficulty,
          carCount,
          thinkingTime,
          currentCarIndex: 0,
          timerEndTime: Date.now() + thinkingTime * 1000,
          cars: shuffled,
          answersMap: {},
          submittedPlayerIds: [],
          revealedAnswers: [],
          validatedPlayerIds: [],
          scores: {},
          winner: null,
          engineVersion: 1,
        });
      } catch (fallbackErr) {
        console.error("[rakcha] Client-side Mecanque game initialization failed:", fallbackErr);
      }
    }
  }, [joinedRoom?.code, difficulty, carCount, thinkingTime, setGameState]);

  // Auto-start game immediately on mount if state is in setup
  const initializingRef = useRef(false);

  useEffect(() => {
    if (
      isHost &&
      (gameState.phase === 'setup' || gameState.status === 'setup' || !gameState.cars || gameState.cars.length === 0) &&
      !initializingRef.current
    ) {
      initializingRef.current = true;
      handleStartGame();
    } else if (gameState.phase !== 'setup' && gameState.status !== 'setup' && gameState.cars && gameState.cars.length > 0) {
      initializingRef.current = false;
    }
  }, [isHost, gameState.phase, gameState.status, gameState.cars?.length, handleStartGame]);

  // Sync validationMap when entering validation phase
  useEffect(() => {
    if (gameState.phase === 'validation' && gameState.revealedAnswers) {
      const initialMap: Record<string, boolean> = {};
      gameState.revealedAnswers.forEach((ans) => {
        if (ans.noAnswer) {
          initialMap[ans.playerId] = false;
        } else if (typeof ans.isCorrect === 'boolean') {
          initialMap[ans.playerId] = ans.isCorrect;
        } else if (currentCar) {
          // Auto-check fuzzy answer match as initial suggestion for host
          const cleanUser = ans.text.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          const isMatch = currentCar.acceptedAnswers.some((acc) => {
            const cleanAcc = acc.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanUser === cleanAcc || cleanUser.includes(cleanAcc) || cleanAcc.includes(cleanUser);
          });
          initialMap[ans.playerId] = isMatch;
        }
      });
      setValidationMap(initialMap);
    }
  }, [gameState.phase, gameState.revealedAnswers, currentCar]);

  // Reset local submission state when a new answering round/car begins
  useEffect(() => {
    if (gameState.phase === 'answering') {
      setHasSubmittedLocal(false);
      setInputAnswer('');
    }
  }, [gameState.phase, gameState.currentCarIndex]);

  // Timer countdown synchronized to `timerEndTime`
  useEffect(() => {
    if (gameState.phase !== 'answering' || !gameState.timerEndTime) {
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((gameState.timerEndTime! - Date.now()) / 1000));
      setLocalTimeRemaining((prev) => (prev === remaining ? prev : remaining));

      // Auto advance to reveal phase when time expires
      if (remaining <= 0) {
        handleTimeoutTransition();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, batterySaver ? 1000 : 500);
    return () => clearInterval(interval);
  }, [isHost, gameState.phase, gameState.timerEndTime, batterySaver]);

  // Check if all players have submitted
  const submittedIds = gameState.submittedPlayerIds || [];

  useEffect(() => {
    if (
      gameState.phase === 'answering' &&
      realPlayers.length > 0 &&
      submittedIds.length >= realPlayers.length
    ) {
      // All real players submitted -> transition to reveal
      handleTimeoutTransition();
    }
  }, [gameState.phase, submittedIds.length, realPlayers.length]);

  // Host transition from answering to reveal phase
  const handleTimeoutTransition = async () => {
    if (gameState.engineVersion === 2) {
      try {
        await advanceMecanqueRound({
          roomCode: joinedRoom?.code,
          action: 'timeout'
        });
      } catch (err) {
        console.error("[rakcha] Failed to timeout transition via backend:", err);
      }
      return;
    }

    setGameState((prev) => {
      if (prev.phase !== 'answering') return prev;

      const existingRevealed = prev.revealedAnswers || [];
      const submittedMap = new Map(existingRevealed.map((r) => [r.playerId, r]));

      // Fill missing real players with "noAnswer"
      const finalRevealed: MecanqueRevealedAnswer[] = realPlayers.map((p) => {
        if (submittedMap.has(p.id)) {
          return submittedMap.get(p.id)!;
        }
        return {
          playerId: p.id,
          playerName: p.name,
          playerAvatar: p.avatarUrl,
          text: 'Aucune réponse',
          noAnswer: true,
          isCorrect: false,
        };
      });

      return {
        ...prev,
        phase: 'reveal',
        revealedAnswers: finalRevealed,
      };
    });
  };

  // Play Engine Sound Clue
  const handlePlaySound = () => {
    if (!currentCar) return;
    setIsPlayingAudio(true);
    if (soundEnabled) {
      playEngineRevSound(currentCar.soundProfile, currentCar.customAudioUrl);
    }
    setTimeout(() => setIsPlayingAudio(false), 2800);
  };

  // Player Answer Submission
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim() || hasSubmittedLocal || gameState.phase !== 'answering') return;

    const trimmed = inputAnswer.trim();
    setHasSubmittedLocal(true);

    if (gameState.engineVersion === 2) {
      try {
        await submitMecanqueGuess({
          roomCode: joinedRoom?.code,
          guessText: trimmed,
          currentCarIndex: gameState.currentCarIndex,
        });
      } catch (err) {
        console.error("[rakcha] Failed to submit guess via backend:", err);
        setHasSubmittedLocal(false);
      }
      return;
    }

    // Legacy v1 logic below
    setGameState((prev) => {
      const answersMap = prev.answersMap || {};
      if (answersMap[myPlayerId]) return prev;

      const newAnswer: MecanqueRevealedAnswer = {
        playerId: myPlayerId,
        playerName: userProfile.name,
        playerAvatar: userProfile.avatarUrl,
        text: trimmed,
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedAnswersMap = {
        ...answersMap,
        [myPlayerId]: newAnswer,
      };

      const submittedPlayerIds = Object.keys(updatedAnswersMap);
      const revealedAnswers = Object.values(updatedAnswersMap);

      return {
        ...prev,
        answersMap: updatedAnswersMap,
        submittedPlayerIds,
        revealedAnswers,
      };
    });
  };

  // Host Validation toggle
  const togglePlayerValidation = (playerId: string) => {
    if (!isHost || gameState.engineVersion === 2) return;
    setValidationMap((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  // Host confirms validation & moves to next car or ends match
  const handleConfirmValidationAndNext = async () => {
    if (gameState.engineVersion === 2) {
      try {
        await advanceMecanqueRound({
          roomCode: joinedRoom?.code,
          action: 'next_car'
        });
      } catch (err) {
        console.error("[rakcha] Failed to move to next car via backend:", err);
      }
      return;
    }
    if (!isHost) return;

    setGameState((prev) => {
      const updatedScores = { ...(prev.scores || {}) };
      const validatedPlayerIds: string[] = [];

      // Award +5 points to every player marked as correct by host
      Object.entries(validationMap).forEach(([pid, isCorrect]) => {
        if (isCorrect) {
          updatedScores[pid] = (updatedScores[pid] || 0) + 5;
          validatedPlayerIds.push(pid);
        }
      });

      const nextIndex = (prev.currentCarIndex || 0) + 1;
      const isMatchEnded = nextIndex >= (prev.cars || []).length;

      if (isMatchEnded) {
        // Calculate winner
        let topPlayer = { playerId: '', playerName: 'Player', score: -1 };
        realPlayers.forEach((p) => {
          const s = updatedScores[p.id] || 0;
          if (s > topPlayer.score) {
            topPlayer = { playerId: p.id, playerName: p.name, score: s };
          }
        });

        return {
          ...prev,
          status: 'ended',
          phase: 'ended',
          scores: updatedScores,
          validatedPlayerIds,
          winner: topPlayer,
        };
      }

      return {
        ...prev,
        currentCarIndex: nextIndex,
        phase: 'answering',
        timerEndTime: Date.now() + prev.thinkingTime * 1000,
        answersMap: {},
        submittedPlayerIds: [],
        revealedAnswers: [],
        validatedPlayerIds,
        scores: updatedScores,
      };
    });
  };

  // Host manual transition from Reveal to Validation
  const handleProceedToValidation = async () => {
    if (gameState.engineVersion === 2) {
      try {
        await advanceMecanqueRound({
          roomCode: joinedRoom?.code,
          action: 'validate'
        });
      } catch (err) {
        console.error("[rakcha] Failed to proceed to validation via backend:", err);
      }
      return;
    }
    if (!isHost) return;
    setGameState((prev) => ({
      ...prev,
      phase: 'validation',
    }));
  };

  // Restart match in room directly using saved room settings
  const handlePlayAgain = () => {
    if (!isHost) return;
    handleStartGame();
  };

  // Sorted Scoreboard
  const sortedScoreboard = [...realPlayers].sort((a, b) => {
    const scores = gameState.scores || {};
    const scoreA = scores[a.id] || 0;
    const scoreB = scores[b.id] || 0;
    return scoreB - scoreA;
  });

  // Trigger coin settlement on match completion
  useEffect(() => {
    if (gameState.phase === 'ended' || gameState.status === 'ended') {
      const isV2 = gameState.engineVersion === 2;
      const isDraw = isV2 && gameState.matchResult === 'draw';
      const rankedPlayerIds = sortedScoreboard.map((p) => p.id || p.playerId).filter(Boolean);
      const winnerPlayer = (isV2 && !isDraw) ? gameState.winner : sortedScoreboard[0];
      const winnerId = winnerPlayer?.id || winnerPlayer?.playerId;
      const winnerIds = winnerId ? [winnerId] : (rankedPlayerIds.length > 0 ? [rankedPlayerIds[0]] : []);
      const loserIds = realPlayers.map((p) => p.id).filter((id) => !winnerIds.includes(id));

      settleMatchCoins(
        joinedRoom?.code || 'mecanque_match',
        joinedRoom?.gameTitle || 'Omour Mecanque',
        winnerIds,
        loserIds,
        joinedRoom?.entryCost || 30,
        isDraw,
        rankedPlayerIds
      );
    }
  }, [
    gameState.phase,
    gameState.status,
    gameState.engineVersion,
    gameState.matchResult,
    gameState.winner,
    sortedScoreboard,
    realPlayers,
    joinedRoom?.code,
    joinedRoom?.gameTitle,
    joinedRoom?.entryCost,
    settleMatchCoins,
  ]);

  // ----------------------------------------------------
  // 1. ENDED / MATCH OVER VIEW
  // ----------------------------------------------------
  if (gameState.phase === 'ended' || gameState.status === 'ended') {
    const isV2 = gameState.engineVersion === 2;
    const isDraw = isV2 && gameState.matchResult === 'draw';
    const winnerPlayer = (isV2 && !isDraw) ? gameState.winner : sortedScoreboard[0];
    const scores = gameState.scores || {};

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-auto h-full max-h-full flex flex-col justify-between select-none font-sans px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-br from-[#121726] via-[#0B0E17] to-[#05070C] sm:border-2 border-[#FF5436]/40 sm:rounded-3xl text-white relative overflow-hidden box-border"
      >
        {/* RPM Racing Spotlight Accent */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#FF5436]/10 rounded-full filter blur-[80px] pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0 text-xs font-mono">
          <button
            onClick={requestLeaveRoom}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-[10px] text-[#94A3B8] cursor-pointer hover:bg-white/10"
          >
            <LogOut size={12} />
            <span>QUITTER</span>
          </button>
          <span className="font-bold text-[#FF5436] dark:text-[#FFB800] uppercase tracking-widest">
            🏁 MATCH TERMINÉ
          </span>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 my-2.5 space-y-3.5 pr-0.5">
          {/* Victory Podium Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#151A28] to-[#0B0E17] border border-[#FF5436]/30 p-5 text-center space-y-3 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-[#FF5436]">
              <Trophy size={100} />
            </div>

            <div className="inline-flex p-2.5 rounded-full bg-[#FF5436]/20 text-[#FF5436] dark:text-[#FFB800]">
              <Trophy size={28} />
            </div>

            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#FF5436] dark:text-[#FFB800] uppercase">
                {isDraw ? 'MATCH NUL' : 'CHAMPION OMOUR MECANQUE'}
              </span>
              <h1 className="text-xl font-bold text-white mt-0.5">
                {isDraw ? 'ÉGALITÉ' : (winnerPlayer?.name || winnerPlayer?.playerName || 'Vainqueur')}
              </h1>
              <p className="text-xs font-mono text-[#FF5436] dark:text-[#FFB800] mt-0.5">
                {isDraw ? `${scores[gameState.winnerIds?.[0] || ''] || 0} POINTS CHACUN` : `${scores[winnerPlayer?.id || winnerPlayer?.playerId || ''] || 0} POINTS`}
              </p>
            </div>
          </div>

          {/* Scoreboard List */}
          <div className="space-y-2">
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold font-mono block">TABLEAU DES SCORES :</span>
            <div className="space-y-1.5">
              {sortedScoreboard.map((p, idx) => {
                const pScore = scores[p.id] || 0;
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div
                    key={`mec-score-${p.id}-${idx}`}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base shrink-0">{medals[idx] || `#${idx + 1}`}</span>
                      <img loading="lazy" decoding="async" src={p.avatarUrl} alt={p.name} className="w-6 h-6 rounded-full object-cover border border-[#FF5436]/30 shrink-0" />
                      <span className="font-semibold text-white truncate">{p.name}</span>
                    </div>
                    <span className="font-mono font-bold text-[#FF5436] dark:text-[#FFB800]">{pScore} pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons (Sticky Footer) */}
        <div className="space-y-2 shrink-0 pt-1.5 border-t border-white/10">
          {isHost ? (
            <button
              onClick={handlePlayAgain}
              className="w-full py-3 rounded-2xl bg-[#FF5436] text-white font-mono font-bold text-xs tracking-wider uppercase shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <RefreshCw size={15} />
              <span>REJOUER DANS LA SALLE</span>
            </button>
          ) : (
            <div className="p-2 text-center text-[11px] font-mono text-[#94A3B8] bg-white/5 rounded-xl border border-white/5">
              En attente du Hôte pour relancer une partie...
            </div>
          )}

          <button
            onClick={requestLeaveRoom}
            className="w-full py-3 rounded-2xl bg-white/10 text-white font-mono font-bold text-xs tracking-wider uppercase hover:bg-white/15 transition-all border border-white/5 cursor-pointer"
          >
            RETOUR AU MENU PRINCIPAL
          </button>
        </div>
      </motion.div>
    );
  }

  // ----------------------------------------------------
  // 2. LOADING STATE (Auto-Start game immediately)
  // ----------------------------------------------------
  if (gameState.phase === 'setup' || gameState.status === 'setup' || !gameState.cars || gameState.cars.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center sm:rounded-3xl bg-gradient-to-br from-[#121726] to-[#05070C] sm:border border-[#FF5436]/40 px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center max-w-lg mx-auto font-sans relative">
        <div className="w-10 h-10 border-4 border-[#FF5436] border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
          Lancement d'Omour Mecanque...
        </h3>
        <p className="text-[11px] font-mono text-[#94A3B8] mt-1">
          Chargement des voitures et des indices
        </p>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. ANSWERING PHASE (Secret Input + Timer)
  // ----------------------------------------------------
  if (gameState.phase === 'answering') {
    const isSubmitted = (gameState.submittedPlayerIds || []).includes(myPlayerId) || hasSubmittedLocal;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-auto h-full max-h-full flex flex-col justify-between select-none font-sans px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-br from-[#121726] via-[#0B0E17] to-[#05070C] sm:border-2 border-[#FF5436]/40 sm:rounded-3xl text-white relative overflow-hidden box-border animate-fade-in"
      >
        {/* RPM Racing Spotlight Accent */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#FF5436]/10 rounded-full filter blur-[80px] pointer-events-none" />

        {/* Top Status Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] font-mono shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={requestLeaveRoom}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 text-[10px] text-[#94A3B8] cursor-pointer hover:bg-white/10 transition-all"
            >
              <LogOut size={11} />
              <span>QUITTER</span>
            </button>

            {/* Dynamic Theme Picker Button */}
            <button
              onClick={() => setIsThemePickerOpen(true)}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-xl border ${currentLeagueTheme.headerBadge} flex items-center gap-1 text-[9px] font-mono font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm`}
              title="Change Table Aesthetic Theme"
            >
              <span>{currentLeagueTheme.badgeEmoji}</span>
              <span className="hidden sm:inline">{currentLeagueTheme.leagueName}</span>
            </button>
          </div>

          <span className="font-bold text-[#FF5436] dark:text-[#FFB800] tracking-wider uppercase text-[10px]">
            CAR #{((gameState.currentCarIndex || 0) + 1)} / {(gameState.cars || []).length}
          </span>

          <div className="px-2 py-0.5 rounded-full bg-[#FF5436]/20 text-[#FF5436] dark:text-[#FFB800] font-bold text-[10px] flex items-center gap-1">
            <Clock size={11} />
            <span>{localTimeRemaining}s</span>
          </div>
        </div>

        {/* Scrollable Middle Area (Clues + Engine Sound + Player List) */}
        <div className="flex-1 overflow-y-auto min-h-0 my-2.5 space-y-3 pr-0.5">
          {/* Clue Dashboard */}
          <div className="rounded-3xl bg-gradient-to-b from-[#1E293B] to-[#0B0E17] border border-[#FF5436]/30 p-4 space-y-3.5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF5436]/20 text-[#FF5436] dark:text-[#FFB800] text-[9px] font-mono font-bold uppercase">
                <Gauge size={11} />
                <span>SPECIFICATIONS & INDICES</span>
              </div>

              <span className="text-[10px] font-mono text-[#FF5436] dark:text-[#FFB800] font-bold">
                {currentCar?.flag} {currentCar?.country}
              </span>
            </div>

            {/* Clues List */}
            <div className="space-y-1.5">
              {currentCar?.clues.map((clueText, idx) => (
                <motion.div
                  key={`mec-clue-${idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] sm:text-xs font-medium flex items-start gap-2"
                >
                  <span className="text-[#FF5436] dark:text-[#FFB800] font-mono font-bold shrink-0">#{idx + 1}</span>
                  <span className="leading-normal">{clueText}</span>
                </motion.div>
              ))}
            </div>

            {/* Engine Sound Clue Button */}
            <div className="pt-1">
              <button
                onClick={handlePlaySound}
                className={`w-full py-2.5 px-3 rounded-xl border font-mono text-[10px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-[#FF5436] text-white border-[#FF5436] scale-98'
                    : 'bg-[#FF5436]/15 text-[#FF5436] dark:text-[#FFB800] border-[#FF5436]/30 hover:bg-[#FF5436]/25'
                }`}
              >
                <Volume2 size={14} className={isPlayingAudio ? 'animate-bounce' : ''} />
                <span>{isPlayingAudio ? 'SON DU MOTEUR EN COURS...' : '🔊 ÉCOUTER LE SON DU MOTEUR'}</span>
              </button>
            </div>
          </div>

          {/* Player Submission Status Bar */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2 font-mono text-[10px]">
            <span className="text-[9px] text-[#94A3B8] uppercase font-bold block">
              STATUT DES JOUEURS ({submittedIds.length}/{realPlayers.length}):
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {realPlayers.map((p, pIdx) => {
                const pDone = submittedIds.includes(p.id);
                return (
                  <div
                    key={`mec-player-status-${p.id}-${pIdx}`}
                    className={`flex items-center justify-between p-2 rounded-xl border text-[10px] ${
                      pDone
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold'
                        : 'bg-black/20 border-white/5 text-[#94A3B8]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <img loading="lazy" decoding="async" src={p.avatarUrl} alt={p.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span className="shrink-0">{pDone ? '🔒 Prêt' : '⏳ Saisie'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Secret Answer Input Box (Sticky Footer) */}
        <div className="rounded-2xl bg-white dark:bg-[#151A28] border border-black/15 dark:border-white/10 p-3.5 space-y-2.5 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#FF5436] dark:text-[#FFB800] uppercase tracking-wider flex items-center gap-1">
              <Lock size={12} />
              <span>VOTRE RÉPONSE SECRÈTE (CACHÉE)</span>
            </span>
          </div>

          {isSubmitted ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>Réponse verrouillée 🔒</span>
              </div>
              <span className="text-[9px] text-emerald-300 font-bold">En attente des autres...</span>
            </div>
          ) : (
            <form onSubmit={handleAnswerSubmit} className="flex gap-2">
              <input
                type="text"
                required
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                placeholder="Ex: BMW M3, Golf 8..."
                className="flex-1 px-3 py-2.5 rounded-xl bg-black/5 dark:bg-[#0B0E17] border border-black/10 dark:border-white/10 text-xs text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#FF5436]"
              />
              <button
                type="submit"
                className="px-3 py-2.5 rounded-xl bg-[#FF5436] text-white font-mono font-bold text-xs uppercase hover:opacity-95 transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Send size={12} />
                <span>ENVOYER</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    );
  }

  // ----------------------------------------------------
  // 4. REVEAL PHASE (Show All Submitted Answers)
  // ----------------------------------------------------
  if (gameState.phase === 'reveal') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-auto h-full max-h-full flex flex-col justify-between select-none font-sans px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-br from-[#121726] via-[#0B0E17] to-[#05070C] sm:border-2 border-[#FF5436]/40 sm:rounded-3xl text-white relative overflow-hidden box-border"
      >
        {/* RPM Racing Spotlight Accent */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#FF5436]/10 rounded-full filter blur-[80px] pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] font-mono shrink-0">
          <span className="font-bold text-[#FF5436] dark:text-[#FFB800] uppercase tracking-wider flex items-center gap-1">
            🎉 RÉVÉLATION DE LA VOITURE #{gameState.currentCarIndex + 1}
          </span>
          <span className="text-white/60 font-semibold truncate max-w-[150px]">{currentCar?.fullName}</span>
        </div>

        {/* Scrollable Middle Area */}
        <div className="flex-1 overflow-y-auto min-h-0 my-2.5 space-y-3 pr-0.5">
          {/* Revealed Car Reveal Card */}
          <div className="rounded-3xl bg-gradient-to-br from-[#1E293B] to-[#0B0E17] border border-[#FF5436]/35 p-4.5 space-y-2.5 text-white shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-lg">{currentCar?.flag} {currentCar?.country}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FF5436]/20 text-[#FF5436] dark:text-[#FFB800] font-mono text-[9px] font-bold uppercase">
                RÉVÉLATION
              </span>
            </div>

            <div>
              <span className="text-[9px] font-mono text-[#FF5436] dark:text-[#FFB800] uppercase tracking-widest block">LA VOITURE ÉTAIT :</span>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5 leading-tight">{currentCar?.fullName}</h2>
              <p className="text-[10px] sm:text-xs font-mono text-[#94A3B8] mt-1">{currentCar?.engine} • {currentCar?.performance}</p>
            </div>
          </div>

          {/* Revealed Player Answers */}
          <div className="rounded-2xl bg-white/5 border border-white/5 p-3.5 space-y-2.5 shadow-sm font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#FF5436] dark:text-[#FFB800] uppercase flex items-center gap-1">
                <Eye size={12} />
                <span>RÉPONSES DE TOUS LES JOUEURS</span>
              </span>
            </div>

            <div className="space-y-1.5">
              {(gameState.revealedAnswers || []).map((ans, idx) => (
                <div
                  key={`ans-${ans.playerId}-${idx}`}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-[11px] ${
                    ans.noAnswer
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      : 'bg-black/20 border-white/5 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    <img loading="lazy" decoding="async" src={ans.playerAvatar} alt={ans.playerName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    <div className="truncate">
                      <span className="font-bold block text-[10px] leading-tight truncate">{ans.playerName}</span>
                      <span className="text-[10px] opacity-80 truncate block mt-0.5">"{ans.text}"</span>
                    </div>
                  </div>

                  {ans.noAnswer && (
                    <span className="text-[9px] text-rose-400 font-bold shrink-0">❌ Non</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Host Control / Proceed (Sticky Footer) */}
        <div className="shrink-0 pt-1.5 border-t border-white/10">
          {isHost || gameState.engineVersion === 2 ? (
            <button
              onClick={handleProceedToValidation}
              className="w-full py-3 rounded-2xl bg-[#FF5436] text-white font-mono font-bold text-xs tracking-wider uppercase shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <span>{isHost || gameState.engineVersion !== 2 ? "VALIDATION DES POINTS →" : "PASSER À LA VALIDATION →"}</span>
              <ChevronRight size={15} />
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center text-[10px] font-mono text-[#94A3B8]">
              En attente du Hôte pour la validation des scores...
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ----------------------------------------------------
  // 5. HOST VALIDATION PHASE (Host assigns correct answers)
  // ----------------------------------------------------
  if (gameState.phase === 'validation') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-auto h-full max-h-full flex flex-col justify-between select-none font-sans px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-br from-[#121726] via-[#0B0E17] to-[#05070C] sm:border-2 border-[#FF5436]/40 sm:rounded-3xl text-white relative overflow-hidden box-border"
      >
        {/* RPM Racing Spotlight Accent */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#FF5436]/10 rounded-full filter blur-[80px] pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] font-mono shrink-0">
          <span className="font-bold text-[#FF5436] dark:text-[#FFB800] uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck size={12} />
            <span>VALIDATION HÔTE</span>
          </span>
          <span className="text-white/60 font-semibold truncate max-w-[150px]">{currentCar?.fullName}</span>
        </div>

        {/* Scrollable Middle Content */}
        <div className="flex-1 overflow-y-auto min-h-0 my-2.5 space-y-3 pr-0.5">
          {/* Instructions box */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-0.5 font-mono text-[10px]">
            <h3 className="font-bold text-white">Vérification (+5 pts par bonne réponse)</h3>
            <p className="text-[#94A3B8]">
              {isHost
                ? 'Attribuez les points en cliquant sur ✅ ou ❌.'
                : 'L’Hôte valide les réponses des joueurs en temps réel.'}
            </p>
          </div>

          {/* Validation List */}
          <div className="space-y-1.5 font-mono">
            {(gameState.revealedAnswers || []).map((ans, idx) => {
              const isChecked = Boolean(validationMap[ans.playerId]);

              return (
                <div
                  key={`val-${ans.playerId}-${idx}`}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 transition-all text-xs ${
                    isChecked
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-black/20 border-white/5 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1">
                    <img loading="lazy" decoding="async" src={ans.playerAvatar} alt={ans.playerName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-[10px] block truncate leading-tight">{ans.playerName}</span>
                      <span className="text-[10px] italic text-[#94A3B8] truncate block mt-0.5">"{ans.text}"</span>
                    </div>
                  </div>

                  {isHost ? (
                    <button
                      type="button"
                      onClick={() => togglePlayerValidation(ans.playerId)}
                      className={`px-2 py-1 rounded-xl font-bold text-[9px] border flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                        isChecked
                          ? 'bg-emerald-500 text-black border-emerald-500 shadow-md'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/20'
                      }`}
                    >
                      {isChecked ? (
                        <>
                          <Check size={11} strokeWidth={3} />
                          <span>+5 PTS</span>
                        </>
                      ) : (
                        <>
                          <X size={11} strokeWidth={3} />
                          <span>0 PTS</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-xl text-[9px] font-bold uppercase border shrink-0 ${
                      isChecked
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/20'
                    }`}>
                      {isChecked ? '✅ +5' : '❌ 0'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions Bar (Sticky Footer) */}
        <div className="shrink-0 pt-1.5 border-t border-white/10">
          {isHost || gameState.engineVersion === 2 ? (
            <button
              onClick={handleConfirmValidationAndNext}
              className="w-full py-3 rounded-2xl bg-[#FF5436] text-white font-mono font-bold text-xs tracking-wider uppercase shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>VALIDER ET VOIT SUIVANTE ➡️</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center text-[10px] font-mono text-[#94A3B8]">
              Le Hôte valide les points et lancera la voiture suivante...
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
};

export const MecanqueGameView = React.memo(MecanqueGameViewComponent);
