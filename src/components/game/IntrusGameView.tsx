import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Trophy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getThemeById } from '../../theme/gameThemeEngine';
import { useGameState } from '../../hooks/useGameState';
import { useGameFinishedAd } from '../../hooks/useGameFinishedAd';
import { INTRUS_TOPICS } from '../../data/intrusTopics';
import { RoomPlayer } from '../../types';

export interface FeedItem {
  id: string;
  tour: number;
  askerId: string;
  askerName: string;
  askerAvatar: string;
  targetId: string;
  targetName: string;
  targetAvatar: string;
  question: string;
  answer?: string;
  timestamp: string;
}

export type IntrusPhase =
  | 'SECRET_ASSIGNMENT'
  | 'TOUR_1'
  | 'TOUR_2'
  | 'VOTING'
  | 'VOTE_RESULTS'
  | 'ELIMINATION_REVEAL'
  | 'INTRUS_FINAL_GUESS'
  | 'NEW_ROUND_TRANSITION'
  | 'GAME_OVER';

const IntrusGameViewComponent: React.FC = () => {
  const { joinedRoom, requestLeaveRoom, userProfile, currentUid, soundEnabled, setSoundEnabled, intrusTopics, settleMatchCoins, selectedGameTheme, setIsThemePickerOpen, batterySaver } = useApp();
  const currentLeagueTheme = getThemeById(selectedGameTheme, userProfile?.level || 1);
  const currentUserId = currentUid || userProfile.id || '';
  const isHost = Boolean(currentUserId && (joinedRoom?.hostId === currentUserId || joinedRoom?.hostId === userProfile?.id));

  // Players in the room
  const defaultBots = React.useMemo(() => [
    { id: currentUserId, name: userProfile.name, avatarUrl: userProfile.avatarUrl, isHost: true, isReady: true, username: userProfile.username },
    { id: 'bot-1', name: 'Adem', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', isHost: false, isReady: true, username: '@adem' },
    { id: 'bot-2', name: 'Sara', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', isHost: false, isReady: true, username: '@sara' },
    { id: 'bot-3', name: 'Mohamed', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', isHost: false, isReady: true, username: '@mohamed' },
  ], [currentUserId, userProfile.name, userProfile.avatarUrl, userProfile.username]);

  // Room players
  const allPlayers: RoomPlayer[] = React.useMemo(() => {
    return joinedRoom?.players && joinedRoom.players.length > 0 ? joinedRoom.players : defaultBots;
  }, [joinedRoom?.players, defaultBots]);

  // Game Engine States

  const [syncedState, setSyncedState] = useGameState(joinedRoom?.code || '', {
    phase: 'SECRET_ASSIGNMENT',
    roundNumber: 1,
    secretTopic: INTRUS_TOPICS[0],
    intrusPlayerId: '',
    activePlayerIds: [],
    eliminatedPlayerIds: [],
    currentTourNumber: 1,
    turnOrder: [],
    targetMap: {},
    currentTurnIndex: 0,
    turnStep: 'ASKING',
    questionInput: '',
    answerInput: '',
    feedItems: [],
    currentActiveQ: null,
    userVote: null,
    votesMap: {},
    votesDetails: {},
    eliminatedInRound: null,
    isEliminatedIntrus: false,
    intrusGuessInput: '',
    intrusFinalResult: {
      success: false,
      guessedTopic: ''
    },
    stageEndTime: 0
  });

  const {
    phase = 'LOBBY',
    roundNumber = 1,
    secretTopic = '',
    intrusPlayerId = '',
    activePlayerIds = [],
    currentTourNumber = 1,
    turnOrder = [],
    targetMap = {},
    currentTurnIndex = 0,
    turnStep = 'ASKING',
    feedItems = [],
    currentActiveQ = null,
    votesMap = {},
    votesDetails = {},
    eliminatedInRound = null,
    isEliminatedIntrus = false,
    intrusFinalResult = { success: false, guessedTopic: '' },
    stageEndTime = 0
  } = (syncedState || {}) as any;

  // Local state for private inputs to prevent clobbering other players' views
  const [userVote, setUserVote] = useState<string | null>(null);
  const [intrusGuessInput, setIntrusGuessInput] = useState<string>('');

  const setPhase = (val: any) => setSyncedState((prev: any) => ({ ...prev, phase: typeof val === 'function' ? val(prev.phase) : val }));
  const setRoundNumber = (val: any) => setSyncedState((prev: any) => ({ ...prev, roundNumber: typeof val === 'function' ? val(prev.roundNumber) : val }));
  const setSecretTopic = (val: any) => setSyncedState((prev: any) => ({ ...prev, secretTopic: typeof val === 'function' ? val(prev.secretTopic) : val }));
  const setIntrusPlayerId = (val: any) => setSyncedState((prev: any) => ({ ...prev, intrusPlayerId: typeof val === 'function' ? val(prev.intrusPlayerId) : val }));
  const setActivePlayerIds = (val: any) => setSyncedState((prev: any) => ({ ...prev, activePlayerIds: typeof val === 'function' ? val(prev.activePlayerIds) : val }));
  const setEliminatedPlayerIds = (val: any) => setSyncedState((prev: any) => ({ ...prev, eliminatedPlayerIds: typeof val === 'function' ? val(prev.eliminatedPlayerIds) : val }));
  const setCurrentTourNumber = (val: any) => setSyncedState((prev: any) => ({ ...prev, currentTourNumber: typeof val === 'function' ? val(prev.currentTourNumber) : val }));
  const setTurnOrder = (val: any) => setSyncedState((prev: any) => ({ ...prev, turnOrder: typeof val === 'function' ? val(prev.turnOrder) : val }));
  const setTargetMap = (val: any) => setSyncedState((prev: any) => ({ ...prev, targetMap: typeof val === 'function' ? val(prev.targetMap) : val }));
  const setCurrentTurnIndex = (val: any) => setSyncedState((prev: any) => ({ ...prev, currentTurnIndex: typeof val === 'function' ? val(prev.currentTurnIndex) : val }));
  const setFeedItems = (val: any) => setSyncedState((prev: any) => ({ ...prev, feedItems: typeof val === 'function' ? val(prev.feedItems) : val }));
  const setVotesMap = (val: any) => setSyncedState((prev: any) => ({ ...prev, votesMap: typeof val === 'function' ? val(prev.votesMap) : val }));
  const setVotesDetails = (val: any) => setSyncedState((prev: any) => ({ ...prev, votesDetails: typeof val === 'function' ? val(prev.votesDetails) : val }));
  const setEliminatedInRound = (val: any) => setSyncedState((prev: any) => ({ ...prev, eliminatedInRound: typeof val === 'function' ? val(prev.eliminatedInRound) : val }));
  const setIsEliminatedIntrus = (val: any) => setSyncedState((prev: any) => ({ ...prev, isEliminatedIntrus: typeof val === 'function' ? val(prev.isEliminatedIntrus) : val }));
  const setStageEndTime = (val: any) => setSyncedState((prev: any) => ({ ...prev, stageEndTime: typeof val === 'function' ? val(prev.stageEndTime) : val }));
  const setIntrusFinalResult = (val: any) => setSyncedState((prev: any) => ({ ...prev, intrusFinalResult: typeof val === 'function' ? val(prev.intrusFinalResult) : val }));

  // Replaced phase by useGameState

  // Show the preloaded interstitial (if ready) exactly once when the game ends.
  useGameFinishedAd(phase === 'GAME_OVER');

  const hasSettledIntrusRef = useRef<boolean>(false);

  // Trigger coin settlement on L'Intrus match end
  useEffect(() => {
    if (phase === 'GAME_OVER') {
      if (hasSettledIntrusRef.current) return;
      hasSettledIntrusRef.current = true;
      const intrusWon = isEliminatedIntrus || (intrusFinalResult && intrusFinalResult.success);
      const winnerIds = intrusWon
        ? [intrusPlayerId]
        : allPlayers.map((p) => p.id).filter((id) => id !== intrusPlayerId);
      const loserIds = allPlayers.map((p) => p.id).filter((id) => !winnerIds.includes(id));

      settleMatchCoins(
        joinedRoom?.code || 'intrus_match',
        joinedRoom?.gameTitle || "L'Intrus",
        winnerIds,
        loserIds,
        joinedRoom?.entryCost || 30,
        false
      );
    } else {
      hasSettledIntrusRef.current = false;
    }
  }, [
    phase,
    isEliminatedIntrus,
    intrusFinalResult,
    intrusPlayerId,
    allPlayers,
    joinedRoom?.code,
    joinedRoom?.gameTitle,
    joinedRoom?.entryCost,
    settleMatchCoins,
  ]);
  // Replaced roundNumber by useGameState
  // Replaced secretTopic by useGameState
  // Replaced intrusPlayerId by useGameState
  // Replaced activePlayerIds by useGameState
  // Replaced eliminatedPlayerIds by useGameState

  // Turn & Tour Tracking
  // Replaced currentTourNumber by useGameState
  // Replaced turnOrder by useGameState
  // Replaced targetMap by useGameState
  // Replaced currentTurnIndex by useGameState
  // Replaced turnStep by useGameState

  // Question & Answer Inputs
  // Replaced questionInput by useGameState
  // Replaced answerInput by useGameState
  // Replaced feedItems by useGameState
  // Replaced currentActiveQ by useGameState

  // Voting & Results
  // Replaced userVote by useGameState
  // Replaced votesMap by useGameState
  // Replaced votesDetails by useGameState // voterId -> targetId
  // Replaced eliminatedInRound by useGameState
  // Replaced isEliminatedIntrus by useGameState

  // Intrus Final Guess
  // Replaced intrusGuessInput by useGameState
  

  // Secret card reveal toggle
  const [showSecretTopic, setShowSecretTopic] = useState(false);

  // Turn Timer States (60 seconds per turn)
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const isAdvancingRef = React.useRef(false);

  // Helper to pick random element
  const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize Round
  const startNewRoundLogic = useCallback((remainingActiveIds: string[], newRoundNum: number) => {
    // Pick topic
    const availableTopics = (intrusTopics && intrusTopics.length > 0) ? intrusTopics.filter((t) => t.isActive !== false) : INTRUS_TOPICS;
    const topic = pickRandom(availableTopics.length > 0 ? availableTopics : INTRUS_TOPICS);
    setSecretTopic(topic);

    // Pick Intrus among remaining active players
    const intrus = pickRandom(remainingActiveIds);
    setIntrusPlayerId(intrus);

    setRoundNumber(newRoundNum);
    setPhase('SECRET_ASSIGNMENT');
    setShowSecretTopic(false);
    setFeedItems([]);
    setVotesMap({});
    setVotesDetails({});
    setUserVote(null);
    setEliminatedInRound(null);
    setIsEliminatedIntrus(false);
    setIntrusGuessInput('');
    setIntrusFinalResult(null);
    if (isHost && !stageEndTime) setStageEndTime(Date.now() + 60000);
    isAdvancingRef.current = false;
  }, []);

  const isInitializingGameRef = useRef<boolean>(false);

  // First game startup - only host initializes to prevent race conditions
  useEffect(() => {
    if (!isHost) return;
    if (intrusPlayerId && activePlayerIds.length > 0) {
      isInitializingGameRef.current = false;
      return;
    }
    if (isInitializingGameRef.current) return;
    isInitializingGameRef.current = true;
    const initialIds = allPlayers.map((p) => p.id);
    setActivePlayerIds(initialIds);
    setEliminatedPlayerIds([]);
    startNewRoundLogic(initialIds, 1);
  }, [isHost, allPlayers, intrusPlayerId, activePlayerIds.length, startNewRoundLogic]);

  // Generate Turn Order and Target Mapping for a Tour
  const setupTour = useCallback((tourNum: 1 | 2, playersList: string[]) => {
    setCurrentTourNumber(tourNum);
    
    // Shuffle players list for turn order
    const shuffledOrder = [...playersList].sort(() => Math.random() - 0.5);
    setTurnOrder(shuffledOrder);

    // Assign target for each asking player (cannot ask self)
    const mapping: Record<string, string> = {};
    const count = shuffledOrder.length;

    for (let i = 0; i < count; i++) {
      const asker = shuffledOrder[i];
      // Target offset: in tour 1 ask next player (i+1), in tour 2 ask (i+2)
      const offset = tourNum === 1 ? 1 : Math.min(2, count - 1);
      const targetIndex = (i + offset) % count;
      mapping[asker] = shuffledOrder[targetIndex];
    }

    setTargetMap(mapping);
    setCurrentTurnIndex(0);
    if (isHost && !stageEndTime) setStageEndTime(Date.now() + 60000);
    isAdvancingRef.current = false;
  }, []);

  // Transition from Secret Assignment to Tour 1
  const handleStartTour1 = () => {
    setPhase('TOUR_1');
    setupTour(1, activePlayerIds);
  };

  const currentAskerId = turnOrder[currentTurnIndex] || '';
  const currentTargetId = targetMap[currentAskerId] || '';

  const askerPlayer = allPlayers.find((p) => p.id === currentAskerId);
  const targetPlayer = allPlayers.find((p) => p.id === currentTargetId);

  const isMyTurnToAsk = currentAskerId === currentUserId;

  // Countdown timer effect for each turn
  useEffect(() => {
    if (phase !== 'TOUR_1' && phase !== 'TOUR_2') return;

    if (isHost && !stageEndTime) setStageEndTime(Date.now() + 60000);
    isAdvancingRef.current = false;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (isHost && !isAdvancingRef.current) {
            isAdvancingRef.current = true;
            handleNextTurn(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, batterySaver ? 2000 : 1000);

    return () => clearInterval(interval);
  }, [currentTurnIndex, currentTourNumber, phase, isHost, batterySaver]);

  // Handle Next Turn (Verbal Interaction Done or Timer Expired)
  const handleNextTurn = (isAutoTimer = false) => {
    // Only the host can execute automatic or bot turn transitions to avoid write storms
    const currentAskerId = turnOrder[currentTurnIndex] || '';
    if ((isAutoTimer || (currentAskerId && currentAskerId.startsWith('bot-'))) && !isHost) {
      return;
    }
    if (isAdvancingRef.current && !isAutoTimer) return;
    isAdvancingRef.current = true;

    if (!askerPlayer || !targetPlayer) return;

    const newItem: FeedItem = {
      id: `turn-${Date.now()}`,
      tour: currentTourNumber,
      askerId: askerPlayer.id,
      askerName: askerPlayer.name,
      askerAvatar: askerPlayer.avatarUrl,
      targetId: targetPlayer.id,
      targetName: targetPlayer.name,
      targetAvatar: targetPlayer.avatarUrl,
      question: `Question orale posée à ${targetPlayer.name}`,
      answer: `Réponse donnée par ${targetPlayer.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setFeedItems((prev) => [...prev, newItem]);

    // Advance turn
    const nextIndex = currentTurnIndex + 1;
    if (nextIndex < turnOrder.length) {
      setCurrentTurnIndex(nextIndex);
      if (isHost && !stageEndTime) setStageEndTime(Date.now() + 60000);
    } else {
      // Tour completed
      if (currentTourNumber === 1) {
        setPhase('TOUR_2');
        setupTour(2, activePlayerIds);
      } else {
        // Tour 2 finished -> Go to Voting!
        setPhase('VOTING');
      }
    }
  };

  // AI Simulation for Bots during turns
  useEffect(() => {
    if ((phase === 'TOUR_1' || phase === 'TOUR_2') && currentAskerId.startsWith('bot-')) {
      const timer = setTimeout(() => {
        handleNextTurn();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, currentTurnIndex, currentAskerId]);

  // Handle Voting
  const handleCastVote = (targetId: string) => {
    setUserVote(targetId);
  };

  const handleConfirmVote = () => {
    if (!userVote) return;

    setSyncedState((prev: any) => {
      const currentVotesDetails = prev.votesDetails || {};
      
      // Update our own vote
      const updatedVotesDetails = {
        ...currentVotesDetails,
        [currentUserId]: userVote,
      };

      // Check if all active humans have voted
      const activeHumans = (prev.activePlayerIds || []).filter((id: string) => !id.startsWith('bot-'));
      const allHumansVoted = activeHumans.every((uid: string) => updatedVotesDetails[uid] !== undefined);

      if (allHumansVoted) {
        // If all humans have voted, simulate bot votes and transition to VOTE_RESULTS
        const finalVotesDetails = { ...updatedVotesDetails };
        
        (prev.activePlayerIds || []).forEach((voterId: string) => {
          if (voterId.startsWith('bot-')) {
            const eligibleTargets = (prev.activePlayerIds || []).filter((id: string) => id !== voterId);
            if (eligibleTargets.length > 0) {
              const botTarget = pickRandom(eligibleTargets) as string;
              finalVotesDetails[voterId] = botTarget;
            }
          }
        });

        // Compute votesMap
        const votesMap: Record<string, number> = {};
        (prev.activePlayerIds || []).forEach((pId: string) => {
          votesMap[pId] = 0;
        });

        Object.values(finalVotesDetails).forEach((targetId: any) => {
          if (votesMap[targetId] !== undefined) {
            votesMap[targetId]++;
          }
        });

        return {
          ...prev,
          votesDetails: finalVotesDetails,
          votesMap,
          phase: 'VOTE_RESULTS',
        };
      } else {
        // Not all humans have voted, just save the updated votesDetails
        return {
          ...prev,
          votesDetails: updatedVotesDetails,
        };
      }
    });
  };

  // Resolve Voting Elimination
  const handleResolveElimination = () => {
    // Find player with highest votes
    let highestCount = -1;
    let eliminatedId = '';

    Object.entries(votesMap).forEach(([pId, countVal]) => {
      const count = countVal as number;
      if (count > highestCount) {
        highestCount = count;
        eliminatedId = pId;
      }
    });

    const eliminatedPlayer = allPlayers.find((p) => p.id === eliminatedId) || null;
    setEliminatedInRound(eliminatedPlayer);

    const isIntrus = eliminatedId === intrusPlayerId;
    setIsEliminatedIntrus(isIntrus);
    setPhase('ELIMINATION_REVEAL');
  };

  // Continue after Elimination reveal
  const handleProceedAfterElimination = () => {
    if (!eliminatedInRound) return;

    if (isEliminatedIntrus) {
      // Intrus was eliminated -> Intrus gets ONE final guess!
      setPhase('INTRUS_FINAL_GUESS');
    } else {
      // Wrong player eliminated!
      const updatedActive = activePlayerIds.filter((id) => id !== eliminatedInRound.id);
      setActivePlayerIds(updatedActive);
      setEliminatedPlayerIds((prev) => [...prev, eliminatedInRound.id]);

      // Check if enough players remain to continue
      if (updatedActive.length <= 2) {
        // Intrus wins by survival!
        setIntrusFinalResult({
          guessedTopic: secretTopic.title,
          isCorrect: true,
          winnerTeam: 'INTRUS',
        });
        setPhase('GAME_OVER');
      } else {
        // Start new round
        startNewRoundLogic(updatedActive, roundNumber + 1);
      }
    }
  };

  // Intrus Final Topic Guess Submission
  const handleIntrusSubmitGuess = (guessText: string) => {
    const cleanGuess = guessText.trim().toLowerCase();
    const cleanTopic = secretTopic.title.toLowerCase();

    // Check if guess matches or contains key words
    const isCorrect =
      cleanGuess.length > 2 &&
      (cleanTopic.includes(cleanGuess) || cleanGuess.includes(secretTopic.category));

    if (isCorrect) {
      setIntrusFinalResult({
        guessedTopic: guessText,
        isCorrect: true,
        winnerTeam: 'INTRUS',
      });
    } else {
      setIntrusFinalResult({
        guessedTopic: guessText,
        isCorrect: false,
        winnerTeam: 'PLAYERS',
      });
    }

    setPhase('GAME_OVER');
  };

  const isHumanIntrus = currentUserId === intrusPlayerId;

  return (
    <div
      style={{
        paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        paddingLeft: 'max(10px, env(safe-area-inset-left, 10px))',
        paddingRight: 'max(10px, env(safe-area-inset-right, 10px))',
      }}
      className="relative w-full max-w-2xl mx-auto h-full max-h-full bg-gradient-to-br from-[#180E29] via-[#100A1D] to-[#08040F] text-white sm:rounded-3xl p-3 sm:p-5 sm:border-2 border-purple-500/40 shadow-[0_20px_50px_rgba(147,51,234,0.2)] overflow-hidden flex flex-col justify-between select-none sm:ring-1 ring-purple-400/20 box-border"
    >
      {/* Dark Spy Lounge Spotlight Backdrop Accent */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full filter blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full filter blur-[80px] pointer-events-none" />
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={requestLeaveRoom}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <h3 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>L'INTRUS 🕵️‍♂️</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                ROUND {roundNumber}
              </span>
            </h3>
            <p className="text-[9px] sm:text-[10px] text-white/60 font-mono">
              {activePlayerIds.length} Players Active
            </p>
          </div>
        </div>

        {/* Theme Picker & Audio Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsThemePickerOpen(true)}
            className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border ${currentLeagueTheme.headerBadge} flex items-center gap-1 text-[10px] sm:text-xs font-mono font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md`}
            title="Change Table Aesthetic Theme"
          >
            <span>{currentLeagueTheme.badgeEmoji}</span>
            <span className="hidden sm:inline">{currentLeagueTheme.leagueName}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* PHASE 1: SECRET ASSIGNMENT */}
      {phase === 'SECRET_ASSIGNMENT' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center my-3 sm:my-6 text-center space-y-4 sm:space-y-6 overflow-y-auto"
        >
          <div className="space-y-1 sm:space-y-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
              — SECRET INFORMATION —
            </span>
            <h2 className="text-lg sm:text-xl font-bold">
              {isHumanIntrus ? '🕵️‍♂️ VOUS ÊTES L\'INTRUS !' : '🎯 VOTRE SUJET SECRET'}
            </h2>
          </div>

          {/* Secret Card */}
          <div className="w-full max-w-sm p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-purple-900/40 to-slate-900 border-2 border-purple-500/50 shadow-2xl space-y-3 sm:space-y-4 relative overflow-hidden">
            {isHumanIntrus ? (
              <div className="space-y-2.5 sm:space-y-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto text-xl sm:text-2xl">
                  🕵️‍♂️
                </div>
                <h3 className="text-base sm:text-lg font-bold text-red-400 uppercase">VOUS NE CONNAISSEZ PAS LE SUJET</h3>
                <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed font-mono">
                  Écoutez attentivement les questions et réponses des autres joueurs. Bluffez sans vous faire démasquer et essayez de deviner le sujet !
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center mx-auto text-2xl sm:text-3xl">
                  {secretTopic.icon}
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] sm:text-[10px] font-mono text-purple-300 uppercase">SUJET SECRET DE LA MANCHE</span>
                  <h3 className="text-xl sm:text-2xl font-black text-purple-200 tracking-wide">
                    {showSecretTopic ? secretTopic.title : '••••••••••••'}
                  </h3>
                </div>

                <button
                  onClick={() => setShowSecretTopic(!showSecretTopic)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] sm:text-xs font-mono text-purple-300 transition-colors"
                >
                  {showSecretTopic ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showSecretTopic ? 'Masquer' : 'Afficher le sujet'}</span>
                </button>

                <p className="text-[10px] sm:text-[11px] text-white/60 font-mono">
                  Gardez ce sujet strictly secret ! Ne le révélez à personne.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleStartTour1}
            className="w-full max-w-sm py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            COMMENCER LE TOUR 1 →
          </button>
        </motion.div>
      )}

      {/* PHASE 2 & 3: TOUR 1 / TOUR 2 INTERACTION */}
      {(phase === 'TOUR_1' || phase === 'TOUR_2') && (
        <div className="flex-1 flex flex-col justify-between my-1.5 sm:my-2 space-y-3 sm:space-y-4 min-h-0">
          {/* Tour Progress Banner */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 text-[11px] sm:text-xs font-mono shrink-0">
            <span className="font-bold text-purple-400">
              {currentTourNumber === 1 ? 'TOUR 1 / 2' : 'TOUR 2 / 2'}
            </span>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border font-bold flex items-center gap-1 ${
                timeLeft <= 10
                  ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                  : 'bg-black/30 border-purple-500/30 text-purple-200'
              }`}>
                <span>⏱️</span>
                <span>{formatTime(timeLeft)}</span>
              </span>
              <span className="text-white/70">
                Tour {currentTurnIndex + 1} / {turnOrder.length}
              </span>
            </div>
          </div>

          {/* Current Turn Prompt Header */}
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-0.5 shrink-0">
            {turnStep === 'ASKING' ? (
              <p className="text-[11px] sm:text-xs font-mono">
                <span className="font-bold text-purple-400">{askerPlayer?.name}</span> pose une question à{' '}
                <span className="font-bold text-amber-400">{targetPlayer?.name}</span>
              </p>
            ) : (
              <p className="text-[11px] sm:text-xs font-mono">
                <span className="font-bold text-amber-400">{targetPlayer?.name}</span> répond à la question de{' '}
                <span className="font-bold text-purple-400">{askerPlayer?.name}</span>
              </p>
            )}
          </div>

          {/* Live Feed / History of Questions & Answers */}
          <div className="flex-1 overflow-y-auto min-h-[100px] max-h-56 sm:max-h-72 space-y-2.5 p-2 rounded-2xl bg-black/20 border border-white/5">
            {feedItems.length === 0 && !currentActiveQ ? (
              <div className="h-28 flex items-center justify-center text-[11px] sm:text-xs font-mono text-white/40 italic">
                Les questions posées apparaîtront ici...
              </div>
            ) : (
              <>
                {feedItems.map((item, idx) => (
                  <div key={`feed-${item.id}-${idx}`} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] sm:text-xs space-y-1 font-mono">
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-white/50">
                      <span>🎤 {item.askerName} → {item.targetName}</span>
                      <span>Tour {item.tour}</span>
                    </div>
                    <p className="text-purple-200 font-semibold">❓ "{item.question}"</p>
                    {item.answer && (
                      <p className="text-emerald-300 font-medium pl-2.5 border-l-2 border-emerald-500/50">
                        💬 {item.targetName}: "{item.answer}"
                      </p>
                    )}
                  </div>
                ))}

                {/* Currently Active Pending Question */}
                {currentActiveQ && (
                  <div className="p-2.5 rounded-xl bg-purple-900/30 border border-purple-500/40 text-[11px] sm:text-xs space-y-1 font-mono animate-pulse">
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-purple-300">
                      <span>🎤 {currentActiveQ.askerName} → {currentActiveQ.targetName}</span>
                      <span>En attente d'réponse...</span>
                    </div>
                    <p className="text-purple-200 font-semibold">❓ "{currentActiveQ.question}"</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Player Turn Controls & Verbal Instructions */}
          <div className="space-y-2 sm:space-y-3 pt-2 border-t border-white/10 text-center shrink-0">
            {isMyTurnToAsk ? (
              <div className="p-3 sm:p-4 rounded-2xl bg-purple-900/30 border border-purple-500/40 space-y-2.5">
                <div className="space-y-0.5">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest">
                    🎤 VOTRE TOUR
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    Posez une question à <span className="text-amber-400 font-black">{targetPlayer?.name}</span>
                  </h4>
                  <p className="text-[11px] text-white/70 font-mono">
                    Créez votre question verbalement à propos du sujet secret.
                  </p>
                </div>

                <button
                  onClick={handleNextTurn}
                  className="w-full py-2.5 sm:py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>TOUR SUIVANT / SUIVANT →</span>
                </button>
              </div>
            ) : (
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <p className="text-[11px] sm:text-xs font-mono text-white/70">
                  ⌛ Tour de <span className="text-purple-400 font-bold">{askerPlayer?.name}</span> qui interroge <span className="text-amber-400 font-bold">{targetPlayer?.name}</span>...
                </p>
                {currentAskerId.startsWith('bot-') && (
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mt-1.5" />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHASE 4: VOTING */}
      {phase === 'VOTING' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col justify-between my-2 sm:my-4 space-y-3 sm:space-y-4 min-h-0"
        >
          <div className="text-center space-y-0.5 shrink-0">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
              — PHASE DE VOTE —
            </span>
            <h3 className="text-base sm:text-lg font-bold">QUI EST L'INTRUS ?</h3>
            <p className="text-[11px] sm:text-xs text-white/60 font-mono">
              {votesDetails?.[currentUserId]
                ? 'Sujet enregistré. En attente du vote des autres joueurs...'
                : "Sélectionnez le joueur que vous suspectez d'être l'Intrus."}
            </p>
          </div>

          {votesDetails?.[currentUserId] ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-3 sm:space-y-4 overflow-y-auto">
              <div className="w-10 h-10 rounded-full border-4 border-t-purple-500 border-purple-500/20 animate-spin" />
              <p className="text-xs font-mono text-purple-300">
                Vous avez voté. En attente des autres...
              </p>
              {/* Show who has voted so far */}
              <div className="space-y-1.5 w-full max-w-xs bg-white/5 p-3.5 sm:p-4 rounded-2xl border border-white/10 mt-3 sm:mt-4">
                <span className="text-[9px] sm:text-[10px] font-mono text-white/50 uppercase block mb-1.5 text-left">
                  Statut des votes :
                </span>
                {activePlayerIds.map((pId, idx) => {
                  const player = allPlayers.find((p) => p.id === pId);
                  if (!player) return null;
                  const voted = votesDetails[pId] !== undefined;
                  return (
                    <div key={`voted-${pId}-${idx}`} className="flex justify-between items-center text-[11px] sm:text-xs font-mono">
                      <span className="text-white/80">{player.name}</span>
                      <span className={voted ? 'text-emerald-400 font-bold' : 'text-amber-400 animate-pulse'}>
                        {voted ? '✓ VOTÉ' : 'VOTE EN COURS...'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Player Selection Cards */}
              <div className="flex-1 grid grid-cols-2 gap-2.5 sm:gap-3 min-h-[140px] max-h-64 sm:max-h-80 overflow-y-auto p-1">
                {activePlayerIds
                  .filter((pId) => pId !== currentUserId)
                  .map((pId, idx) => {
                    const player = allPlayers.find((p) => p.id === pId);
                    if (!player) return null;
                    const isSelected = userVote === pId;

                    return (
                      <button
                        key={`votetarget-${pId}-${idx}`}
                        onClick={() => handleCastVote(pId)}
                        className={`p-2.5 sm:p-3 rounded-2xl border flex items-center gap-2 sm:gap-3 transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-purple-900/60 border-purple-400 text-white shadow-lg'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <img loading="lazy" decoding="async" src={player.avatarUrl} alt={player.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-purple-500/30" />
                        <div className="overflow-hidden">
                          <p className="text-[11px] sm:text-xs font-mono font-bold truncate">{player.name}</p>
                          <span className="text-[9px] sm:text-[10px] font-mono text-purple-300">
                            {isSelected ? '✓ Suspecté' : 'Cliquer pour voter'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>

              <button
                onClick={handleConfirmVote}
                disabled={!userVote}
                className="w-full py-2.5 sm:py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg disabled:opacity-40 shrink-0 cursor-pointer"
              >
                CONFIRMER MON VOTE →
              </button>
            </>
          )}
        </motion.div>
      )}

      {/* PHASE 5: VOTE RESULTS */}
      {phase === 'VOTE_RESULTS' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col justify-between my-2 sm:my-4 space-y-3 sm:space-y-4 text-center min-h-0"
        >
          <div className="space-y-0.5 shrink-0">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
              — RÉSULTATS DU VOTE —
            </span>
            <h3 className="text-base sm:text-lg font-bold">DÉCOMPTE DES VOIX</h3>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[140px] max-h-64 space-y-2.5 p-3 rounded-2xl bg-black/20 border border-white/10">
            {Object.entries(votesMap).map(([pId, countVal], idx) => {
              const count = countVal as number;
              const player = allPlayers.find((p) => p.id === pId);
              if (!player) return null;
              const percent = Math.round((count / activePlayerIds.length) * 100);

              return (
                <div key={`voteres-${pId}-${idx}`} className="space-y-1 text-left font-mono">
                  <div className="flex justify-between text-[11px] sm:text-xs">
                    <span className="font-bold">{player.name}</span>
                    <span className="text-purple-300">{count} Voix ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all duration-700" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleResolveElimination}
            className="w-full py-2.5 sm:py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg shrink-0 cursor-pointer"
          >
            RÉVÉLER L'ÉLIMINÉ →
          </button>
        </motion.div>
      )}

      {/* PHASE 6: ELIMINATION REVEAL */}
      {phase === 'ELIMINATION_REVEAL' && eliminatedInRound && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center my-3 sm:my-6 text-center space-y-4 sm:space-y-6 overflow-y-auto"
        >
          <div className="space-y-1 sm:space-y-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
              — ÉLIMINATION —
            </span>
            <h2 className="text-lg sm:text-xl font-bold">JOUEUR ÉLIMINÉ</h2>
          </div>

          <div className="p-4 sm:p-6 rounded-3xl bg-white/5 border-2 border-red-500/40 max-w-sm w-full space-y-3 sm:space-y-4">
            <img loading="lazy" decoding="async" src={eliminatedInRound.avatarUrl} alt={eliminatedInRound.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-red-500 mx-auto shadow-xl" />
            <h3 className="text-base sm:text-lg font-bold text-white">{eliminatedInRound.name}</h3>

            {isEliminatedIntrus ? (
              <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] sm:text-xs font-mono font-bold">
                🎯 C'ÉTAIT BIEN L'INTRUS !
              </div>
            ) : (
              <div className="p-2.5 sm:p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] sm:text-xs font-mono font-bold">
                ❌ CE N'ÉTAIT PAS L'INTRUS !
              </div>
            )}
          </div>

          <button
            onClick={handleProceedAfterElimination}
            className="w-full max-w-sm py-2.5 sm:py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer"
          >
            CONTINUER →
          </button>
        </motion.div>
      )}

      {/* PHASE 7: INTRUS FINAL GUESS */}
      {phase === 'INTRUS_FINAL_GUESS' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center my-3 sm:my-6 text-center space-y-4 sm:space-y-6 overflow-y-auto"
        >
          <div className="space-y-1 sm:space-y-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              — CHANCE ULTIME —
            </span>
            <h2 className="text-lg sm:text-xl font-bold">
              {isHumanIntrus ? 'VOUS AVEZ ÉTÉ DÉMASQUÉ !' : 'L\'INTRUS A ÉTÉ DÉMASQUÉ !'}
            </h2>
          </div>

          <div className="p-4 sm:p-6 rounded-3xl bg-purple-950/40 border-2 border-amber-500/50 max-w-sm w-full space-y-3 sm:space-y-4">
            {isHumanIntrus ? (
              <div className="space-y-2.5 sm:space-y-3">
                <p className="text-[11px] sm:text-xs text-white/80 font-mono">
                  Une dernière opportunité ! Quel était le sujet secret de la manche ?
                </p>
                <input
                  type="text"
                  value={intrusGuessInput}
                  onChange={(e) => setIntrusGuessInput(e.target.value)}
                  placeholder="Tapez votre devinette..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-amber-500/40 text-xs font-mono text-white placeholder-white/40 focus:outline-none"
                />
                <button
                  onClick={() => handleIntrusSubmitGuess(intrusGuessInput)}
                  disabled={!intrusGuessInput.trim()}
                  className="w-full py-2.5 sm:py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg disabled:opacity-40 cursor-pointer"
                >
                  SOUMETTRE MON DEVIN
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3 font-mono text-[11px] sm:text-xs">
                <p className="text-purple-200">
                  L'Intrus tente sa dernière chance pour deviner le sujet secret...
                </p>
                <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 animate-pulse text-amber-400 font-bold">
                  ⌛ Devinette en cours...
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* PHASE 8: GAME OVER */}
      {phase === 'GAME_OVER' && intrusFinalResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center my-3 sm:my-6 text-center space-y-4 sm:space-y-6 overflow-y-auto"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/40 shrink-0">
            <Trophy size={28} />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-purple-400">
              {intrusFinalResult.winnerTeam === 'INTRUS' ? 'VICTOIRE DE L\'INTRUS ! 🕵️‍♂️' : 'VICTOIRE DES JOUEURS ! 🎉'}
            </h2>
            <p className="text-[11px] sm:text-xs text-white/70 font-mono">
              Le sujet secret était : <span className="font-bold text-purple-300">{secretTopic.title}</span>
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 font-mono text-[11px] sm:text-xs max-w-sm w-full space-y-1.5">
            <div className="flex justify-between">
              <span className="text-white/60">L'Intrus était :</span>
              <span className="font-bold text-purple-300">
                {allPlayers.find((p) => p.id === intrusPlayerId)?.name}
              </span>
            </div>
            {intrusFinalResult.guessedTopic && (
              <div className="flex justify-between">
                <span className="text-white/60">Devinette de l'Intrus :</span>
                <span className="font-bold text-amber-300">"{intrusFinalResult.guessedTopic}"</span>
              </div>
            )}
          </div>

          <button
            onClick={requestLeaveRoom}
            className="w-full max-w-sm py-2.5 sm:py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer animate-pulse"
          >
            RETOURNER AU SALON
          </button>
        </motion.div>
      )}
    </div>
  );
};

export const IntrusGameView = React.memo(IntrusGameViewComponent);
