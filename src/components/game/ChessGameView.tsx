// ============================================================
//  src/components/game/ChessGameView.tsx
//  RAKCHA GAME — Ultra-Modern Mobile-First Chess Experience
//  Features:
//  - Multi-theme Chess Board (Lavender Slate, Classic Wood, Emerald Green, Tournament Ocean)
//  - Responsive Mobile-First Design: Fits 100% viewport safely without scroll / clipping
//  - Crystal Clear Tap-to-Move with high-contrast legal move dots & red capture targets
//  - King-in-Check dramatic pulse & last move origin/destination highlighting
//  - Real-time Captured Pieces Trays & Material Balance Advantage pills
//  - Dynamic Turn Indicators with active countdown clocks
//  - Action Quick Bar: Chat, Offer Draw, Resign, Undo (AI mode), Flip Board
//  - Tabbed Notation Sheet & Match Info view
//  - Full AI Engine integration (Easy, Medium, Hard, Expert) & Firebase Multiplayer sync
// ============================================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import {
  ChessGame,
  BoardState,
  Move,
  PieceType,
  Color,
  squareToCoords,
  CHESS_TIME_OPTIONS,
  formatChessClock,
  ChessAiBrain,
  AiDifficulty,
} from '../../services/chessEngine';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import {
  ChevronLeft,
  Settings,
  MessageCircle,
  Handshake,
  Flag,
  RotateCcw,
  Volume2,
  VolumeX,
  Bot,
  User,
  Trophy,
  X,
  Eye,
  EyeOff,
  RotateCw,
  Palette,
  ShieldAlert,
  Smile,
  ShoppingBag,
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ChessGameState, ChessTimeOptionId } from '../../types';
import { ChessPieceSvg } from './ChessPieceSvg';
import { RoomChat } from './RoomChat';
import { FREE_EMOJIS, SHOP_EMOJIS } from '../../data/emojis';

// ============================================================
//  Firestore-safe board serialization
//  Firestore does NOT support nested arrays, so the 8x8 board must be
//  encoded as 8 strings (one per rank) before syncing. Uppercase = white,
//  lowercase = black, '.' = empty square.
// ============================================================
const encodeBoardRows = (board: ({ type: PieceType; color: Color } | null)[][]): string[] =>
  board.map((row) =>
    row
      .map((piece) => (!piece ? '.' : piece.color === 'w' ? piece.type.toUpperCase() : piece.type))
      .join('')
  );

const decodeBoardRows = (rows: string[]): ({ type: PieceType; color: Color } | null)[][] =>
  rows.map((row) =>
    row.split('').map((ch) => {
      if (ch === '.') return null;
      const isWhite = ch === ch.toUpperCase();
      return { type: ch.toLowerCase() as PieceType, color: (isWhite ? 'w' : 'b') as Color };
    })
  );

// Strips `undefined` values (Firestore rejects them) and clones deeply.
const firestoreSafe = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

type BoardThemeKey = 'midnight' | 'lavender' | 'classic' | 'emerald' | 'ocean';

const BOARD_THEMES: Record<
  BoardThemeKey,
  {
    name: string;
    light: string;
    dark: string;
    lastLight: string;
    lastDark: string;
    selected: string;
    textLight: string;
    textDark: string;
  }
> = {
  midnight: {
    name: 'Midnight Purple',
    light: '#3C2E63',
    dark: '#241A40',
    lastLight: '#4A3876',
    lastDark: '#2E2150',
    selected: '#6B4FA0',
    textLight: '#D8CCF0',
    textDark: '#EDE6FA',
  },
  lavender: {
    name: 'Lavender Slate',
    light: '#DCCEE8',
    dark: '#82639B',
    lastLight: '#CBB8DC',
    lastDark: '#73548C',
    selected: '#B595D6',
    textLight: '#593976',
    textDark: '#F3ECF8',
  },
  classic: {
    name: 'Classic Wood',
    light: '#F0D9B5',
    dark: '#B58863',
    lastLight: '#E5C495',
    lastDark: '#9E714B',
    selected: '#DFB06C',
    textLight: '#795548',
    textDark: '#FFF8E1',
  },
  emerald: {
    name: 'Emerald Green',
    light: '#EEEED2',
    dark: '#769656',
    lastLight: '#D8E2A8',
    lastDark: '#5E7D3F',
    selected: '#A6C96C',
    textLight: '#33691E',
    textDark: '#F1F8E9',
  },
  ocean: {
    name: 'Tournament Blue',
    light: '#DEE3E6',
    dark: '#8CA2AD',
    lastLight: '#C8D3D8',
    lastDark: '#6F8794',
    selected: '#9EB9C7',
    textLight: '#37474F',
    textDark: '#ECEFF1',
  },
};

interface ChessGameViewProps {
  isAiMode?: boolean;
  aiConfig?: {
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    timeControlId?: ChessTimeOptionId;
    initialSeconds?: number;
    incrementSeconds?: number;
  };
}

const ChessGameViewComponent: React.FC<ChessGameViewProps> = ({ isAiMode = false, aiConfig }) => {
  const {
    setActiveView,
    t,
    userProfile,
    currentUid,
    exitAiChessGame,
    requestLeaveRoom,
    joinedRoom,
    soundEnabled,
    setSoundEnabled,
    language,
    batterySaver,
    unlockedEmojis,
    setIsEmojiShopOpen,
    sendEmojiReaction,
  } = useApp();

  const isAr = language === 'ar';
  const isFr = language === 'fr';

  // Track layout orientation
  const [isLandscapeDetected, setIsLandscapeDetected] = useState(false);

  useEffect(() => {
    let rafId: number;
    const handleCheckOrientation = () => {
      if (typeof window !== 'undefined') {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const landscape = window.innerWidth > window.innerHeight && window.innerWidth < 1024;
          setIsLandscapeDetected(landscape);
        });
      }
    };

    handleCheckOrientation();
    window.addEventListener('resize', handleCheckOrientation, { passive: true });
    window.addEventListener('orientationchange', handleCheckOrientation, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleCheckOrientation);
      window.removeEventListener('orientationchange', handleCheckOrientation);
    };
  }, []);

  // Board visual customization
  const [boardTheme, setBoardTheme] = useState<BoardThemeKey>('midnight');
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [manualFlip, setManualFlip] = useState<boolean>(false);

  // Determine effective time control settings
  const timeControlSetting = useMemo(() => {
    if (isAiMode) {
      const tcId = aiConfig?.timeControlId || '10m';
      const opt = CHESS_TIME_OPTIONS.find((o) => o.id === tcId) || CHESS_TIME_OPTIONS[4] || CHESS_TIME_OPTIONS[0];
      return {
        id: opt.id as ChessTimeOptionId,
        initialSeconds: aiConfig?.initialSeconds !== undefined ? aiConfig.initialSeconds : opt.initialSeconds,
        incrementSeconds: aiConfig?.incrementSeconds !== undefined ? aiConfig.incrementSeconds : opt.incrementSeconds,
        name: opt.name,
        category: (opt.category || 'CLASSIC').toUpperCase(),
      };
    } else if (joinedRoom?.chessSettings) {
      const tcId = joinedRoom.chessSettings.timeControlId || '10m';
      const opt = CHESS_TIME_OPTIONS.find((o) => o.id === tcId) || CHESS_TIME_OPTIONS[4] || CHESS_TIME_OPTIONS[0];
      return {
        id: tcId,
        initialSeconds: joinedRoom.chessSettings.initialSeconds ?? opt.initialSeconds,
        incrementSeconds: joinedRoom.chessSettings.incrementSeconds ?? opt.incrementSeconds,
        name: opt.name,
        category: (opt.category || 'CLASSIC').toUpperCase(),
      };
    }
    return {
      id: '10m' as ChessTimeOptionId,
      initialSeconds: 600,
      incrementSeconds: 0,
      name: '10 min • Rapid',
      category: 'CLASSIC',
    };
  }, [isAiMode, aiConfig, joinedRoom?.chessSettings]);

  const hasClock = timeControlSetting.initialSeconds > 0;
  const initialMs = timeControlSetting.initialSeconds * 1000;
  const incrementMs = timeControlSetting.incrementSeconds * 1000;

  const chessEngine = useMemo(() => new ChessGame(), []);
  const [boardState, setBoardState] = useState<BoardState>(chessEngine.getState());
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [legalMovesForSelected, setLegalMovesForSelected] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ move: Move } | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>(aiConfig?.difficulty || 'medium');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<'moves' | 'info'>('moves');

  // Modals & Panels State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionCooldown, setReactionCooldown] = useState(false);

  const handleSendQuickReaction = async (emojiId: string) => {
    if (reactionCooldown) return;
    setReactionCooldown(true);
    setTimeout(() => setReactionCooldown(false), 800);
    try {
      await sendEmojiReaction(emojiId);
    } catch (err) {
      console.warn('[Chess Reaction] Error sending reaction:', err);
    }
    setShowReactionPicker(false);
  };

  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const movesScrollRef = useRef<HTMLDivElement | null>(null);

  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTimestampRef = useRef<number>(Date.now());
  const hasRecordedOutcomeRef = useRef<boolean>(false);

  // Time Control State (Timestamp math for precision)
  const [whiteBankMs, setWhiteBankMs] = useState<number>(initialMs);
  const [blackBankMs, setBlackBankMs] = useState<number>(initialMs);
  const [turnStartTimestamp, setTurnStartTimestamp] = useState<number>(() => Date.now());
  const [displayedWhiteMs, setDisplayedWhiteMs] = useState<number>(initialMs);
  const [displayedBlackMs, setDisplayedBlackMs] = useState<number>(initialMs);
  const [timeoutWinner, setTimeoutWinner] = useState<{ winner: Color | 'draw'; reason: string } | null>(null);

  const prevHistoryLenRef = useRef(boardState.history.length);
  const myEffectiveId = currentUid || userProfile?.id || '';

  // Determine Multiplayer Roles (Host = White, Challenger = Black)
  const isMultiplayer = !isAiMode && !!joinedRoom;
  const isHost = joinedRoom ? joinedRoom.hostId === myEffectiveId : true;
  const myPlayerColor: Color = isAiMode ? 'w' : isHost ? 'w' : 'b';

  // Board orientation: Flip if Black or if user manually flipped
  const isFlipped = (myPlayerColor === 'b' && !manualFlip) || (myPlayerColor === 'w' && manualFlip);

  const opponentPlayer = useMemo(() => {
    if (isAiMode) {
      return {
        name: isAr ? 'بوت ركشة' : isFr ? 'Robot Rakcha' : 'Rakcha Bot',
        subtext: `Bot • ${aiDifficulty.toUpperCase()}`,
        avatar: '🤖',
        rating: aiDifficulty === 'easy' ? '800' : aiDifficulty === 'medium' ? '1200' : aiDifficulty === 'hard' ? '1600' : '2000',
        isAi: true,
      };
    }
    if (joinedRoom && joinedRoom.players.length > 1) {
      const opp = joinedRoom.players.find((p) => p.id !== myEffectiveId) || joinedRoom.players[1];
      return {
        name: opp?.name || 'Adversaire',
        subtext: `@${opp?.username || 'player'}`,
        avatar: opp?.avatarUrl || '👤',
        rating: '1200',
        isAi: false,
      };
    }
    return {
      name: 'Adversaire',
      subtext: 'Waiting for player...',
      avatar: '👤',
      rating: '1200',
      isAi: false,
    };
  }, [isAiMode, aiDifficulty, joinedRoom, myEffectiveId, isAr, isFr]);

  // Audio SFX on move / check / capture
  useEffect(() => {
    if (boardState.history.length > prevHistoryLenRef.current) {
      const latestMove = boardState.history[boardState.history.length - 1];
      if (latestMove) {
        if (latestMove.captured || latestMove.isEnPassant) {
          audioManager.playChessCapture();
        } else {
          audioManager.playChessSlide();
        }

        if (
          boardState.status === 'check' ||
          latestMove.san.includes('+') ||
          latestMove.san.includes('#') ||
          boardState.status === 'checkmate'
        ) {
          setTimeout(() => {
            audioManager.playChessCheck();
          }, 140);
        }
      }
      prevHistoryLenRef.current = boardState.history.length;
    }
  }, [boardState]);

  // Auto-scroll moves list to bottom when new moves arrive
  useEffect(() => {
    if (movesScrollRef.current) {
      movesScrollRef.current.scrollTop = movesScrollRef.current.scrollHeight;
    }
  }, [boardState.history.length, activeTab]);

  // Sync multiplayer state from Firestore
  useEffect(() => {
    if (!isMultiplayer || !joinedRoom?.chessGameState) return;
    const remoteState = joinedRoom.chessGameState;

    if (remoteState.history && remoteState.history.length > boardState.history.length) {
      // Rebuild the board: prefer the Firestore-safe encoded rows, fall back to
      // any legacy nested-array snapshot.
      const remoteBoard = remoteState.boardRows
        ? decodeBoardRows(remoteState.boardRows)
        : (remoteState.board as any);
      if (!remoteBoard) return;

      const rebuilt: BoardState = {
        board: remoteBoard,
        turn: remoteState.turn,
        castlingRights:
          (remoteState.castlingRights as any) || { w: { k: true, q: true }, b: { k: true, q: true } },
        enPassantSquare: remoteState.enPassantSquare ?? null,
        halfmoveClock: remoteState.halfmoveClock ?? 0,
        fullmoveNumber: remoteState.fullmoveNumber ?? 1,
        history: (remoteState.history as any) || [],
        capturedWhite: (remoteState.capturedWhite as any) || [],
        capturedBlack: (remoteState.capturedBlack as any) || [],
        status: (remoteState.status === 'playing' ? 'active' : remoteState.status) as any,
        winner: (remoteState.winner as any) ?? null,
        drawReason: remoteState.drawReason,
      };

      chessEngine.loadState(rebuilt);
      setBoardState(chessEngine.getState());
      setSelectedSquare(null);
      setLegalMovesForSelected([]);
      if (remoteState.whiteRemainingMs !== undefined) setWhiteBankMs(remoteState.whiteRemainingMs);
      if (remoteState.blackRemainingMs !== undefined) setBlackBankMs(remoteState.blackRemainingMs);
      if (remoteState.lastMoveTimestamp) setTurnStartTimestamp(remoteState.lastMoveTimestamp);
      prevHistoryLenRef.current = remoteState.history.length;
    }
  }, [isMultiplayer, joinedRoom?.chessGameState, boardState.history.length, chessEngine]);

  const refreshState = useCallback(() => {
    setBoardState(chessEngine.getState());
  }, [chessEngine]);

  const isGameOver =
    boardState.status === 'checkmate' ||
    boardState.status === 'stalemate' ||
    boardState.status === 'draw' ||
    boardState.status === 'timeout' ||
    timeoutWinner !== null;

  // Real-Time Clock Loop
  useEffect(() => {
    if (!hasClock || isGameOver) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.max(0, now - turnStartTimestamp);

      if (boardState.turn === 'w') {
        const remaining = Math.max(0, whiteBankMs - elapsed);
        setDisplayedWhiteMs(remaining);
        setDisplayedBlackMs(blackBankMs);

        if (remaining <= 0 && !timeoutWinner) {
          const res = chessEngine.handleTimeout('w');
          setTimeoutWinner(res);
          refreshState();
          audioManager.playChessCheck();
        }
      } else {
        const remaining = Math.max(0, blackBankMs - elapsed);
        setDisplayedBlackMs(remaining);
        setDisplayedWhiteMs(whiteBankMs);

        if (remaining <= 0 && !timeoutWinner) {
          const res = chessEngine.handleTimeout('b');
          setTimeoutWinner(res);
          refreshState();
          audioManager.playChessCheck();
        }
      }
    }, batterySaver ? 1000 : 50);

    return () => clearInterval(timer);
  }, [
    hasClock,
    isGameOver,
    boardState.turn,
    turnStartTimestamp,
    whiteBankMs,
    blackBankMs,
    timeoutWinner,
    chessEngine,
    refreshState,
    batterySaver,
  ]);

  // AI Turn handler
  useEffect(() => {
    if (isAiMode && boardState.turn === 'b' && !isGameOver) {
      setIsAiThinking(true);
      const thinkingTime = Math.min(1000, Math.max(400, Math.floor(Math.random() * 500) + 400));

      aiTimerRef.current = setTimeout(() => {
        const aiMove = chessEngine.getAiMove(aiDifficulty);
        if (aiMove) {
          const now = Date.now();
          const elapsed = Math.max(0, now - turnStartTimestamp);
          const newBlackBank = Math.max(0, blackBankMs - elapsed) + incrementMs;

          chessEngine.makeMove(aiMove);
          setBlackBankMs(newBlackBank);
          setDisplayedBlackMs(newBlackBank);
          setTurnStartTimestamp(Date.now());
          refreshState();
        }
        setIsAiThinking(false);
        aiTimerRef.current = null;
      }, thinkingTime);

      return () => {
        if (aiTimerRef.current) {
          clearTimeout(aiTimerRef.current);
          aiTimerRef.current = null;
        }
      };
    } else {
      setIsAiThinking(false);
    }
  }, [
    boardState.turn,
    isGameOver,
    isAiMode,
    aiDifficulty,
    chessEngine,
    refreshState,
    turnStartTimestamp,
    blackBankMs,
    incrementMs,
  ]);

  // Move Execution Helper for Tap-to-Move
  const tryMakeMove = async (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    availableMoves?: Move[]
  ): Promise<boolean> => {
    const moves = availableMoves || chessEngine.getLegalMoves(fromRow, fromCol);
    const targetMove = moves.find((m) => m.toRow === toRow && m.toCol === toCol);
    if (!targetMove) return false;

    const movingPiece = boardState.board[fromRow][fromCol];
    const isPromotion =
      movingPiece?.type === 'p' &&
      ((movingPiece.color === 'w' && toRow === 0) || (movingPiece.color === 'b' && toRow === 7));

    if (isPromotion && !targetMove.promotion) {
      setPendingPromotion({ move: targetMove });
      return true;
    } else {
      await executeMove(targetMove);
      setSelectedSquare(null);
      setLegalMovesForSelected([]);
      return true;
    }
  };

  // Tap-to-Move handler
  const handleSquareClick = async (r: number, c: number) => {
    if (isGameOver) return;
    if (isAiMode && boardState.turn === 'b') return;
    if (isMultiplayer && boardState.turn !== myPlayerColor) return;

    const piece = boardState.board[r][c];

    if (selectedSquare) {
      const [sr, sc] = selectedSquare;

      // 1. Tapping the exact same selected piece -> Deselect
      if (sr === r && sc === c) {
        setSelectedSquare(null);
        setLegalMovesForSelected([]);
        return;
      }

      // 2. Tapping another own piece -> Switch selection
      if (piece && piece.color === boardState.turn) {
        setSelectedSquare([r, c]);
        const legal = chessEngine.getLegalMoves(r, c);
        setLegalMovesForSelected(legal);
        return;
      }

      // 3. Tapping a destination square
      const moved = await tryMakeMove(sr, sc, r, c, legalMovesForSelected);
      if (!moved) {
        // Tapped invalid square -> Deselect
        setSelectedSquare(null);
        setLegalMovesForSelected([]);
      }
    } else {
      // No piece selected yet -> Select piece if it's player's turn
      if (piece && piece.color === boardState.turn) {
        setSelectedSquare([r, c]);
        const legal = chessEngine.getLegalMoves(r, c);
        setLegalMovesForSelected(legal);
      }
    }
  };

  // Execute Move and Update Timers
  const executeMove = async (move: Move) => {
    const now = Date.now();
    const elapsed = Math.max(0, now - turnStartTimestamp);

    let nextWhiteMs = whiteBankMs;
    let nextBlackMs = blackBankMs;

    if (boardState.turn === 'w') {
      nextWhiteMs = Math.max(0, whiteBankMs - elapsed) + incrementMs;
      setWhiteBankMs(nextWhiteMs);
      setDisplayedWhiteMs(nextWhiteMs);
    } else {
      nextBlackMs = Math.max(0, blackBankMs - elapsed) + incrementMs;
      setBlackBankMs(nextBlackMs);
      setDisplayedBlackMs(nextBlackMs);
    }

    const success = chessEngine.makeMove(move);
    if (!success) return;

    if (isAiMode && boardState.turn === 'w') {
      const history = chessEngine.getState().history;
      const lastRecord = history[history.length - 1];
      if (lastRecord) {
        const isCheck = lastRecord.san.includes('+') || lastRecord.san.includes('#');
        const isCastling = !!lastRecord.isCastling || lastRecord.san === 'O-O' || lastRecord.san === 'O-O-O';
        const isCapture = !!lastRecord.captured || !!lastRecord.isEnPassant;
        ChessAiBrain.recordHumanMove(lastRecord.san, isCheck, isCastling, isCapture);
      }
    }

    const nextTimestamp = Date.now();
    setTurnStartTimestamp(nextTimestamp);
    refreshState();

    if (isMultiplayer && joinedRoom) {
      try {
        const updatedEngineState = chessEngine.getState();
        const roomRef = doc(db, 'antifada_rooms', joinedRoom.code || joinedRoom.id);
        const syncPayload: Partial<ChessGameState> = {
          status: updatedEngineState.status as any,
          turn: updatedEngineState.turn,
          history: firestoreSafe(updatedEngineState.history),
          // Sync the FULL board snapshot too — encoded as 8 strings because
          // Firestore rejects nested arrays (that rejection used to abort the
          // whole sync, leaving the opponent stuck unable to move).
          boardRows: encodeBoardRows(updatedEngineState.board as any),
          castlingRights: updatedEngineState.castlingRights,
          enPassantSquare: updatedEngineState.enPassantSquare,
          halfmoveClock: updatedEngineState.halfmoveClock,
          fullmoveNumber: updatedEngineState.fullmoveNumber,
          capturedWhite: updatedEngineState.capturedWhite as any,
          capturedBlack: updatedEngineState.capturedBlack as any,
          whiteRemainingMs: nextWhiteMs,
          blackRemainingMs: nextBlackMs,
          lastMoveTimestamp: nextTimestamp,
          timeControlId: timeControlSetting.id,
          initialSeconds: timeControlSetting.initialSeconds,
          incrementSeconds: timeControlSetting.incrementSeconds,
          winner: updatedEngineState.winner ?? null,
          drawReason: updatedEngineState.drawReason ?? null,
        } as any;
        await updateDoc(roomRef, {
          chessGameState: firestoreSafe(syncPayload),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Failed to sync multiplayer chess move:', err);
      }
    }
  };

  const handlePromotionSelect = async (promoType: PieceType) => {
    if (!pendingPromotion) return;
    const move = { ...pendingPromotion.move, promotion: promoType };
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMovesForSelected([]);
    await executeMove(move);
  };

  // Undo / Redo (Strictly for AI mode)
  const canUndo = isAiMode && boardState.history.length > 0 && !isGameOver;
  const canRedo = isAiMode && chessEngine.canRedo() && !isGameOver;
  // Remembers how many plies the last Undo rewound, so Redo can replay the
  // exact same number of plies forward again (e.g. undoing a full player+AI
  // round-trip should redo the same round-trip, not just one ply).
  const lastUndoStepsRef = useRef<number>(0);

  const handleUndo = () => {
    if (!canUndo) return;

    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    setIsAiThinking(false);
    setSelectedSquare(null);
    setLegalMovesForSelected([]);
    setPendingPromotion(null);

    if (boardState.turn === 'b') {
      chessEngine.undo();
      lastUndoStepsRef.current = 1;
    } else {
      if (boardState.history.length >= 2) {
        chessEngine.undo();
        chessEngine.undo();
        lastUndoStepsRef.current = 2;
      } else {
        chessEngine.undo();
        lastUndoStepsRef.current = 1;
      }
    }

    prevHistoryLenRef.current = chessEngine.getState().history.length;
    setTurnStartTimestamp(Date.now());
    refreshState();
    audioManager.playChessSlide();
  };

  const handleRedo = () => {
    if (!canRedo) return;

    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    setIsAiThinking(false);
    setSelectedSquare(null);
    setLegalMovesForSelected([]);
    setPendingPromotion(null);

    // Replay forward the same number of plies that were last undone (falls
    // back to a single ply if we don't have that info, e.g. after a reload).
    const steps = lastUndoStepsRef.current > 0 ? lastUndoStepsRef.current : 1;
    for (let i = 0; i < steps && chessEngine.canRedo(); i++) {
      chessEngine.redo();
    }
    lastUndoStepsRef.current = 0;

    prevHistoryLenRef.current = chessEngine.getState().history.length;
    setTurnStartTimestamp(Date.now());
    refreshState();
    audioManager.playChessSlide();
  };

  // Resignation Handler
  const handleConfirmResign = () => {
    setShowResignModal(false);
    chessEngine.resign(myPlayerColor);
    refreshState();
    audioManager.playChessCheck();

    if (isMultiplayer && joinedRoom) {
      const roomRef = doc(db, 'antifada_rooms', joinedRoom.code || joinedRoom.id);
      void updateDoc(roomRef, {
        'chessGameState.status': 'checkmate',
        'chessGameState.winner': myPlayerColor === 'w' ? 'b' : 'w',
        updatedAt: serverTimestamp(),
      });
    }
  };

  // Draw Offer Handler
  const handleOfferDraw = () => {
    setShowDrawModal(true);
  };

  const handleAcceptDrawAi = () => {
    setShowDrawModal(false);
    chessEngine.handleTimeout(boardState.turn);
    chessEngine.getState();
    setBoardState((prev) => ({
      ...prev,
      status: 'draw',
      winner: 'draw',
      drawReason: 'Agreement',
    }));
  };

  // Record outcome to Adaptive AI Knowledge Base
  useEffect(() => {
    if (isGameOver && !hasRecordedOutcomeRef.current) {
      hasRecordedOutcomeRef.current = true;
      const durationSeconds = Math.max(1, Math.round((Date.now() - gameStartTimestampRef.current) / 1000));
      const moveCount = boardState.history.length;
      const isDraw = boardState.status === 'draw' || boardState.status === 'stalemate' || timeoutWinner?.winner === 'draw';
      const playerWon = boardState.winner === 'w' || timeoutWinner?.winner === 'w';
      const firstMoveSan = boardState.history[0]?.san || 'e4';

      ChessAiBrain.recordGameOutcome(
        playerWon,
        isDraw,
        aiDifficulty,
        moveCount,
        durationSeconds,
        firstMoveSan
      );
    }
  }, [isGameOver, boardState.status, boardState.winner, boardState.history, timeoutWinner, aiDifficulty]);

  const handleReset = () => {
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    gameStartTimestampRef.current = Date.now();
    hasRecordedOutcomeRef.current = false;
    setIsAiThinking(false);
    chessEngine.reset();
    prevHistoryLenRef.current = 0;
    setWhiteBankMs(initialMs);
    setBlackBankMs(initialMs);
    setDisplayedWhiteMs(initialMs);
    setDisplayedBlackMs(initialMs);
    setTurnStartTimestamp(Date.now());
    setTimeoutWinner(null);
    refreshState();
    setSelectedSquare(null);
    setLegalMovesForSelected([]);
    setPendingPromotion(null);
  };

  // Material evaluation differential
  const materialAdvantage = useMemo(() => {
    let whiteScore = 0;
    let blackScore = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = boardState.board[r][c];
        if (p) {
          if (p.color === 'w') whiteScore += PIECE_VALUES[p.type];
          else blackScore += PIECE_VALUES[p.type];
        }
      }
    }

    return {
      whiteDiff: whiteScore - blackScore,
      blackDiff: blackScore - whiteScore,
    };
  }, [boardState.board]);

  // Turn status label for Moves panel
  const getStatusText = () => {
    if (boardState.history.length === 0) return isAr ? 'بدأت اللعبة • بالتوفيق!' : isFr ? 'La partie a commencé' : 'Game in progress';
    if (boardState.status === 'check') {
      return isAr
        ? `${boardState.turn === 'w' ? 'الأبيض' : 'الأسود'} في كش ملك!`
        : `${boardState.turn === 'w' ? 'White' : 'Black'} is in Check!`;
    }
    if (boardState.status === 'checkmate') {
      return isAr
        ? `كش مات! الفائز: ${boardState.winner === 'w' ? 'الأبيض' : 'الأسود'}`
        : `Checkmate! ${boardState.winner === 'w' ? 'White' : 'Black'} wins!`;
    }
    if (boardState.status === 'draw' || boardState.status === 'stalemate') {
      return isAr ? `تعادل (${boardState.drawReason || 'اتفاق'})` : `Draw (${boardState.drawReason || 'Agreement'})`;
    }
    if (boardState.turn === myPlayerColor) {
      return isAr ? 'دورك الآن' : isFr ? 'À votre tour' : 'Your turn to move';
    }
    return isAr ? `دور ${opponentPlayer.name}` : `${opponentPlayer.name}'s turn`;
  };

  // Active theme colors
  const activeThemeObj = BOARD_THEMES[boardTheme] || BOARD_THEMES.lavender;

  // Render 8x8 Grid Squares
  const renderSquares = () => {
    const squares = [];
    const rowRange = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const colRange = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

    for (const r of rowRange) {
      for (const c of colRange) {
        const piece = boardState.board[r][c];
        const isLight = (r + c) % 2 === 0;
        const isSelected = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
        const isLegalMove = legalMovesForSelected.some((m) => m.toRow === r && m.toCol === c);
        const isLastMove =
          boardState.history.length > 0 &&
          (() => {
            const last = boardState.history[boardState.history.length - 1];
            const fromCoords = squareToCoords(last.from);
            const toCoords = squareToCoords(last.to);
            return (
              (fromCoords[0] === r && fromCoords[1] === c) ||
              (toCoords[0] === r && toCoords[1] === c)
            );
          })();

        const isKingInCheckSquare =
          boardState.status === 'check' &&
          piece?.type === 'k' &&
          piece?.color === boardState.turn;

        const squareBg = isKingInCheckSquare
          ? '#E11D48'
          : isSelected
          ? activeThemeObj.selected
          : isLastMove
          ? isLight
            ? activeThemeObj.lastLight
            : activeThemeObj.lastDark
          : isLight
          ? activeThemeObj.light
          : activeThemeObj.dark;

        // Coordinate markers inside squares if enabled
        const rankLabel = 8 - r;
        const fileLabel = String.fromCharCode(97 + c);
        const showFile = isFlipped ? r === 0 : r === 7;
        const showRank = isFlipped ? c === 7 : c === 0;

        squares.push(
          <div
            key={`sq-${r}-${c}`}
            onClick={() => handleSquareClick(r, c)}
            style={{ backgroundColor: squareBg }}
            className={`relative aspect-square flex items-center justify-center cursor-pointer transition-colors select-none ${
              isSelected ? 'ring-2 sm:ring-3 ring-amber-300 z-20 shadow-inner' : ''
            } ${isKingInCheckSquare ? 'ring-4 ring-rose-500 animate-pulse z-30' : ''}`}
          >
            {/* Embedded Coordinates */}
            {showCoordinates && showRank && (
              <span
                style={{ color: isLight ? activeThemeObj.textLight : activeThemeObj.textDark }}
                className="absolute top-0.5 left-0.5 sm:left-1 text-[8px] sm:text-[9px] font-sans font-black select-none pointer-events-none opacity-90 leading-none"
              >
                {rankLabel}
              </span>
            )}
            {showCoordinates && showFile && (
              <span
                style={{ color: isLight ? activeThemeObj.textLight : activeThemeObj.textDark }}
                className="absolute bottom-0.5 right-0.5 sm:right-1 text-[8px] sm:text-[9px] font-sans font-black select-none pointer-events-none opacity-90 leading-none"
              >
                {fileLabel}
              </span>
            )}

            {/* Legal move destination hint */}
            {isLegalMove && (
              piece ? (
                // Capture target ring
                <div className="absolute inset-1 rounded-lg ring-3 ring-rose-500/90 bg-rose-500/25 pointer-events-none z-20 animate-pulse shadow-sm" />
              ) : (
                // Move destination dot
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-purple-950/70 ring-2 ring-purple-200/50 pointer-events-none z-20 shadow-sm" />
              )
            )}

            {/* Chess Piece */}
            {piece && (
              <div
                className={`w-[85%] h-[85%] flex items-center justify-center select-none z-10 pointer-events-none transition-transform duration-150 ${
                  isSelected ? 'scale-110 drop-shadow-lg' : ''
                }`}
              >
                <ChessPieceSvg type={piece.type} color={piece.color} />
              </div>
            )}
          </div>
        );
      }
    }
    return squares;
  };

  const isMyTurn = boardState.turn === myPlayerColor && !isGameOver;
  const isOpponentTurn = boardState.turn !== myPlayerColor && !isGameOver;

  return (
    <div
      style={{
        paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        paddingLeft: 'max(10px, env(safe-area-inset-left, 10px))',
        paddingRight: 'max(10px, env(safe-area-inset-right, 10px))',
      }}
      className="h-[100dvh] max-h-[100dvh] w-full max-w-[440px] mx-auto bg-[#130B24] text-white flex flex-col justify-between select-none overflow-hidden font-sans box-border"
    >
      {/* Landscape Orientation Warning Overlay */}
      {isLandscapeDetected && (
        <div className="fixed inset-0 bg-[#0E061B]/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-purple-900/60 border border-purple-500/50 flex items-center justify-center mb-4 text-purple-300 animate-bounce">
            <RotateCw size={32} />
          </div>
          <h2 className="text-lg font-bold font-sans mb-1 text-purple-100">
            {isAr ? 'الرجاء تدوير الهاتف عمودياً' : isFr ? 'Veuillez tourner votre téléphone' : 'Please rotate your device'}
          </h2>
          <p className="text-xs text-purple-300/80 max-w-xs leading-relaxed font-sans">
            {isAr
              ? 'لعبة الشطرنج مصممة للعب بالوضع العمودي (الطولي) فقط للحصول على أفضل تجربة.'
              : isFr
              ? "Le jeu d'échecs est optimisé exclusivement pour le mode portrait."
              : 'Chess is designed exclusively for vertical (portrait) orientation.'}
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. TOP HEADER BAR: Back Button + Time Badge + Quick Actions */}
      {/* ============================================================ */}
      <header className="w-full flex items-center justify-between shrink-0 px-1 py-1">
        {/* Back / Leave Match */}
        <button
          onClick={() => {
            if (isAiMode) {
              exitAiChessGame();
            } else {
              requestLeaveRoom();
            }
          }}
          className="w-8.5 h-8.5 rounded-xl bg-[#201538] border border-[#3A275E] hover:bg-[#2C1C4E] text-purple-200 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
          title={isAr ? 'مغادرة' : 'Leave'}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Time Control Badge */}
        <div className="px-3.5 py-1 rounded-xl bg-[#201538] border border-[#3A275E] flex flex-col items-center justify-center shadow-md min-w-[76px]">
          <span className="text-xs font-bold text-white tracking-wide font-mono leading-tight">
            {timeControlSetting.initialSeconds > 0
              ? `${Math.floor(timeControlSetting.initialSeconds / 60)}:00`
              : '∞'}
          </span>
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-purple-300/80 leading-none">
            {timeControlSetting.category}
          </span>
        </div>

        {/* Settings & Flip Board */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setManualFlip((prev) => !prev)}
            className="w-8.5 h-8.5 rounded-xl bg-[#201538] border border-[#3A275E] hover:bg-[#2C1C4E] text-purple-200 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
            title={isAr ? 'قلب الرقعة' : 'Flip Board'}
          >
            <RotateCw size={15} />
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-8.5 h-8.5 rounded-xl bg-[#201538] border border-[#3A275E] hover:bg-[#2C1C4E] text-purple-200 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
            title={isAr ? 'الإعدادات' : 'Settings'}
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. OPPONENT PLAYER BAR (Above Board) */}
      {/* ============================================================ */}
      <div
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all shrink-0 border ${
          isOpponentTurn
            ? 'bg-[#22163C] border-purple-500/60 shadow-lg shadow-purple-950/50'
            : 'bg-[#180E2B] border-[#2A1B46]'
        }`}
      >
        {/* Left: Avatar + Name + Rating + Turn Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-8.5 h-8.5 rounded-xl bg-[#281A46] border border-[#412B70] overflow-hidden flex items-center justify-center text-base shadow-md shrink-0">
            {opponentPlayer.isAi ? (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center text-white">
                <Bot size={17} />
              </div>
            ) : opponentPlayer.avatar && (opponentPlayer.avatar.startsWith('http') || opponentPlayer.avatar.startsWith('data:')) ? (
              <img
                src={opponentPlayer.avatar}
                alt={opponentPlayer.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-purple-200 text-xs">👤</span>
            )}

            {/* Turn pulse ring */}
            {isOpponentTurn && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-[#130B24] animate-ping" />
            )}
          </div>

          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[160px]">
                {opponentPlayer.name}
              </span>
              {materialAdvantage.blackDiff > 0 && (
                <span className="text-[9px] font-mono font-black text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/40">
                  +{materialAdvantage.blackDiff}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-purple-300/70 font-mono">{opponentPlayer.rating}</span>
              {isAiThinking ? (
                <span className="text-amber-400 font-bold flex items-center gap-0.5 animate-pulse text-[9px]">
                  {isAr ? 'يفكر...' : isFr ? 'Réfléchit...' : 'Thinking...'}
                </span>
              ) : isOpponentTurn ? (
                <span className="text-purple-300/90 font-medium text-[9px]">
                  {isAr ? 'دوره' : 'Active'}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right: Digital Countdown Timer */}
        <div
          className={`px-3 py-1 rounded-xl font-mono text-xs font-black flex items-center justify-center transition-all min-w-[74px] shadow-inner ${
            isOpponentTurn
              ? displayedBlackMs <= 10000 && hasClock
                ? 'bg-rose-950/90 border border-rose-500 text-rose-300 animate-pulse ring-2 ring-rose-500/50'
                : 'bg-[#2E1E50] border border-purple-400 text-white ring-2 ring-purple-500/40'
              : 'bg-[#0E061B] border border-[#271740] text-purple-300/80'
          }`}
        >
          {hasClock ? formatChessClock(displayedBlackMs) : '∞'}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. CHESS BOARD CONTAINER */}
      {/* ============================================================ */}
      <div className="w-full flex items-center justify-center my-auto py-1 shrink-0">
        <div
          ref={boardContainerRef}
          className="w-[min(calc(100vw-22px),calc(100dvh-310px-env(safe-area-inset-top,8px)-env(safe-area-inset-bottom,8px)),360px)] aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-[#412B6B] grid grid-cols-8 grid-rows-8 touch-none select-none box-border"
        >
          {renderSquares()}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3b. QUICK REACTION BUTTON — own row, right-aligned, ABOVE the */}
      {/* player card. Never overlaps avatar/name/rating/timer. */}
      {/* ============================================================ */}
      <div className="w-full flex items-center justify-end shrink-0 px-0.5 pb-1 relative">
        <button
          onClick={() => setShowReactionPicker((prev) => !prev)}
          aria-label={isAr ? 'إرسال تفاعل' : 'Send Reaction'}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border active:scale-95 shadow-sm ${
            showReactionPicker
              ? 'bg-[#2E1E50] border-purple-400 text-white'
              : 'bg-[#201538] border-[#3A275E] text-purple-200 hover:bg-[#2C1C4E] hover:text-white'
          }`}
          title={isAr ? 'تفاعلات سريعة' : 'Quick Reactions'}
        >
          {showReactionPicker ? <X size={13} /> : <Smile size={14} />}
        </button>

        {/* Compact Reaction Popover */}
        <AnimatePresence>
          {showReactionPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute top-8 right-0 w-60 max-w-[80vw] p-2.5 rounded-2xl bg-[#180E2B] border border-[#442E70] shadow-2xl space-y-2 z-40"
            >
              <div className="flex items-center justify-between pb-1 border-b border-purple-900/40">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300/80">
                  {isAr ? 'ردود الفعل' : 'Reactions'}
                </span>
                <button
                  onClick={() => {
                    setShowReactionPicker(false);
                    setIsEmojiShopOpen(true);
                  }}
                  className="flex items-center gap-1 text-[9px] font-mono font-bold text-purple-300 hover:text-white cursor-pointer"
                >
                  <ShoppingBag size={10} />
                  <span>{isAr ? 'المتجر' : 'Shop'}</span>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {FREE_EMOJIS.map((item) => (
                  <button
                    key={item.id}
                    disabled={reactionCooldown}
                    onClick={() => void handleSendQuickReaction(item.id)}
                    className="h-8 rounded-lg bg-[#241A40] hover:bg-[#33244F] flex items-center justify-center text-lg transition-colors cursor-pointer disabled:opacity-50"
                    title={item.name}
                  >
                    {item.emoji}
                  </button>
                ))}
                {SHOP_EMOJIS.filter((e) => unlockedEmojis.includes(e.id)).map((item) => (
                  <button
                    key={item.id}
                    disabled={reactionCooldown}
                    onClick={() => void handleSendQuickReaction(item.id)}
                    className="h-8 rounded-lg bg-[#2C2049] hover:bg-[#3A2C5E] border border-amber-500/30 flex items-center justify-center text-lg transition-colors cursor-pointer disabled:opacity-50"
                    title={item.name}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================================ */}
      {/* 4. USER PLAYER BAR (Below Board) */}
      {/* ============================================================ */}
      <div
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all shrink-0 border ${
          isMyTurn
            ? 'bg-[#22163C] border-emerald-500/60 shadow-lg shadow-purple-950/50 ring-1 ring-emerald-500/30'
            : 'bg-[#180E2B] border-[#2A1B46]'
        }`}
      >
        {/* Left: User Avatar + "You" + Rating + Turn Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-8.5 h-8.5 rounded-xl bg-[#281A46] border border-[#412B70] overflow-hidden flex items-center justify-center text-base shadow-md shrink-0">
            {userProfile.avatarUrl && (userProfile.avatarUrl.startsWith('http') || userProfile.avatarUrl.startsWith('data:')) ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-700 to-indigo-950 flex items-center justify-center text-white font-black text-xs">
                {userProfile.name?.[0] || 'U'}
              </div>
            )}

            {/* My Turn active dot */}
            {isMyTurn && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#130B24] animate-ping" />
            )}
          </div>

          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[160px]">
                {userProfile.name ? `${userProfile.name}` : isAr ? 'أنت' : 'You'}
              </span>
              {materialAdvantage.whiteDiff > 0 && (
                <span className="text-[9px] font-mono font-black text-emerald-300 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-500/40">
                  +{materialAdvantage.whiteDiff}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-purple-300/70 font-mono">1200</span>
              {isMyTurn && (
                <span className="text-emerald-400 font-bold text-[9px]">
                  {isAr ? 'دورك للعب' : isFr ? 'Votre tour' : 'Your Move'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Digital Countdown Timer */}
        <div
          className={`px-3 py-1 rounded-xl font-mono text-xs font-black flex items-center justify-center transition-all min-w-[74px] shadow-inner ${
            isMyTurn
              ? displayedWhiteMs <= 10000 && hasClock
                ? 'bg-rose-950/90 border border-rose-500 text-rose-300 animate-pulse ring-2 ring-rose-500/50'
                : 'bg-[#2E1E50] border border-emerald-400 text-white ring-2 ring-emerald-500/40'
              : 'bg-[#0E061B] border border-[#271740] text-purple-300/80'
          }`}
        >
          {hasClock ? formatChessClock(displayedWhiteMs) : '∞'}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. ACTION QUICK BAR: Chat, Draw, Resign, Undo, Redo */}
      {/* ============================================================ */}
      <div className="w-full grid grid-cols-5 gap-1.5 px-0.5 py-0.5 shrink-0">
        {/* Chat Button */}
        <button
          onClick={() => setShowChatModal(true)}
          className="flex flex-col items-center gap-0.5 group cursor-pointer"
        >
          <div className="w-8.5 h-8.5 rounded-xl bg-[#201538] border border-[#3A275E] group-hover:bg-[#2C1C4E] group-hover:border-purple-400 text-purple-200 group-hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95">
            <MessageCircle size={15} />
          </div>
          <span className="text-[9px] font-bold text-purple-300/80 group-hover:text-purple-200 leading-tight">
            {isAr ? 'دردشة' : isFr ? 'Tchat' : 'Chat'}
          </span>
        </button>

        {/* Offer Draw Button */}
        <button
          onClick={handleOfferDraw}
          disabled={isGameOver}
          className={`flex flex-col items-center gap-0.5 group ${
            isGameOver ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className="w-8.5 h-8.5 rounded-xl bg-[#201538] border border-[#3A275E] group-hover:bg-[#2C1C4E] group-hover:border-purple-400 text-purple-200 group-hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95">
            <Handshake size={15} />
          </div>
          <span className="text-[9px] font-bold text-purple-300/80 group-hover:text-purple-200 leading-tight">
            {isAr ? 'تعادل' : isFr ? 'Nulle' : 'Draw'}
          </span>
        </button>

        {/* Resign Button */}
        <button
          onClick={() => setShowResignModal(true)}
          disabled={isGameOver}
          className={`flex flex-col items-center gap-0.5 group ${
            isGameOver ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className="w-8.5 h-8.5 rounded-xl bg-[#201538] border border-[#3A275E] group-hover:bg-[#2C1C4E] group-hover:border-rose-400 text-purple-200 group-hover:text-rose-300 flex items-center justify-center transition-all shadow-sm active:scale-95">
            <Flag size={15} />
          </div>
          <span className="text-[9px] font-bold text-purple-300/80 group-hover:text-rose-300 leading-tight">
            {isAr ? 'استسلام' : isFr ? 'Abandon' : 'Resign'}
          </span>
        </button>

        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`flex flex-col items-center gap-0.5 group ${
            !canUndo ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className="w-8.5 h-8.5 rounded-xl bg-[#201538] border border-[#3A275E] group-hover:bg-[#2C1C4E] group-hover:border-purple-400 text-purple-200 group-hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95">
            <RotateCcw size={15} />
          </div>
          <span className="text-[9px] font-bold text-purple-300/80 group-hover:text-purple-200 leading-tight">
            {isAr ? 'تراجع' : isFr ? 'Annuler' : 'Undo'}
          </span>
        </button>

        {/* Redo Button */}
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className={`flex flex-col items-center gap-0.5 group ${
            !canRedo ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className="w-8.5 h-8.5 rounded-xl bg-[#201538] border border-[#3A275E] group-hover:bg-[#2C1C4E] group-hover:border-purple-400 text-purple-200 group-hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95">
            <RotateCw size={15} />
          </div>
          <span className="text-[9px] font-bold text-purple-300/80 group-hover:text-purple-200 leading-tight">
            {isAr ? 'إعادة' : isFr ? 'Rétablir' : 'Redo'}
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 6. BOTTOM TABBED PANEL: "Moves" and "Info" */}
      {/* ============================================================ */}
      <div className="w-full bg-[#180E2B] border border-[#2B1D48] rounded-xl p-1.5 flex flex-col flex-1 min-h-[64px] max-h-[82px] shadow-lg overflow-hidden shrink-0">
        {/* Tab Switcher */}
        <div className="w-full bg-[#0E061B] border border-[#22153B] p-0.5 rounded-lg flex gap-1 mb-0.5 shrink-0">
          <button
            onClick={() => setActiveTab('moves')}
            className={`flex-1 py-0.5 text-[10px] font-bold rounded-md text-center transition-all cursor-pointer ${
              activeTab === 'moves'
                ? 'bg-[#2E1E50] text-white shadow-sm'
                : 'text-purple-300/60 hover:text-purple-200'
            }`}
          >
            {isAr ? 'الحركات' : isFr ? 'Coups' : 'Moves'}
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-0.5 text-[10px] font-bold rounded-md text-center transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-[#2E1E50] text-white shadow-sm'
                : 'text-purple-300/60 hover:text-purple-200'
            }`}
          >
            {isAr ? 'معلومات' : isFr ? 'Info' : 'Info'}
          </button>
        </div>

        {/* Moves Tab Content */}
        {activeTab === 'moves' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="text-center text-[10px] text-purple-300/80 font-medium py-0.5 shrink-0 truncate">
              {getStatusText()}
            </div>

            <div
              ref={movesScrollRef}
              className="flex-1 overflow-y-auto space-y-0.5 pr-1 font-mono text-[11px] text-purple-200"
            >
              {boardState.history.length === 0 ? (
                <div className="text-center text-purple-400/40 italic py-1.5 text-[10px]">
                  {isAr ? 'لم تلعب أي حركة بعد' : 'No moves played yet'}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 px-2">
                  {boardState.history.map((mov, idx) => {
                    if (idx % 2 === 0) {
                      const moveNum = Math.floor(idx / 2) + 1;
                      const nextMove = boardState.history[idx + 1];
                      return (
                        <React.Fragment key={`mh-${idx}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-purple-400/60 w-3 text-right">
                              {moveNum}.
                            </span>
                            <span className="font-bold text-white">{mov.san}</span>
                          </div>
                          <div className="flex items-center">
                            {nextMove ? (
                              <span className="font-bold text-white">{nextMove.san}</span>
                            ) : (
                              <span className="text-transparent">-</span>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Tab Content */}
        {activeTab === 'info' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-1 py-0.5 text-[10px] text-purple-200 font-mono overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-0.5">
              <span className="text-purple-300/70">Time Control:</span>
              <span className="font-bold text-white">{timeControlSetting.name}</span>
            </div>
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-0.5">
              <span className="text-purple-300/70">Game Mode:</span>
              <span className="font-bold text-white">
                {isAiMode ? `Vs Bot (${aiDifficulty.toUpperCase()})` : '1v1 Online'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 7. MODALS & POPUPS */}
      {/* ============================================================ */}

      {/* Pawn Promotion Modal */}
      <AnimatePresence>
        {pendingPromotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-[#1C1236] border border-[#442E70] p-5 rounded-3xl shadow-2xl max-w-xs w-full text-center space-y-3"
            >
              <h3 className="text-sm font-bold text-white font-mono">
                {isAr ? 'ترقية البيدق' : isFr ? 'Promotion du Pion' : 'Pawn Promotion'}
              </h3>
              <p className="text-[11px] text-purple-300/70">
                {isAr ? 'اختر القطعة المراد الترقية إليها:' : 'Choose a piece to promote to:'}
              </p>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { type: 'q' as PieceType, label: isAr ? 'وزير' : 'Queen' },
                  { type: 'r' as PieceType, label: isAr ? 'قلعة' : 'Rook' },
                  { type: 'b' as PieceType, label: isAr ? 'فيل' : 'Bishop' },
                  { type: 'n' as PieceType, label: isAr ? 'حصان' : 'Knight' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handlePromotionSelect(item.type)}
                    className="p-2.5 rounded-2xl bg-[#2C1D4F] hover:bg-[#3B2868] border border-[#4B357F] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-md"
                  >
                    <div className="w-8 h-8">
                      <ChessPieceSvg type={item.type} color={boardState.turn} />
                    </div>
                    <span className="text-[10px] font-bold text-purple-200">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1C1236] border border-[#442E70] p-5 rounded-3xl shadow-2xl max-w-xs w-full text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-900/50 border border-purple-500/50 flex items-center justify-center mx-auto text-purple-300 text-xl shadow-lg">
                <Trophy size={24} className="text-amber-400" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide">
                  {boardState.status === 'checkmate'
                    ? isAr ? 'كش مات!' : 'Checkmate!'
                    : timeoutWinner
                    ? isAr ? 'انتهى الوقت!' : 'Time Out!'
                    : isAr ? 'تعادل!' : 'Game Drawn!'}
                </h2>
                <p className="text-[11px] text-purple-200/80 font-mono">
                  {boardState.status === 'checkmate'
                    ? `${boardState.winner === 'w' ? (isAr ? 'الأبيض' : 'White') : (isAr ? 'الأسود' : 'Black')} ${isAr ? 'فاز باللعبة' : 'won by checkmate'}`
                    : timeoutWinner
                    ? timeoutWinner.reason
                    : isAr ? 'انتهت اللعبة بالتعادل' : `Draw by ${boardState.drawReason || 'stalemate'}`}
                </p>
              </div>

              <div className="flex gap-2 justify-center pt-1">
                {isAiMode ? (
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    {isAr ? 'إعادة اللعب' : 'Play Rematch'}
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveView('waiting_room')}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    {isAr ? 'غرفة الانتظار' : 'Return to Lobby'}
                  </button>
                )}
                <button
                  onClick={() => setActiveView('home')}
                  className="flex-1 py-2.5 rounded-xl bg-[#2C1D4F] hover:bg-[#3B2868] text-purple-200 border border-[#442E70] font-bold font-mono text-xs active:scale-95 transition-all cursor-pointer"
                >
                  {isAr ? 'الرئيسية' : 'Exit Home'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resign Confirmation Modal */}
      <AnimatePresence>
        {showResignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              className="bg-[#1C1236] border border-[#442E70] p-5 rounded-3xl shadow-2xl max-w-xs w-full text-center space-y-3"
            >
              <div className="w-11 h-11 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                <Flag size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'هل تريد الاستسلام؟' : isFr ? 'Abandonner la partie ?' : 'Resign Game?'}
                </h3>
                <p className="text-[11px] text-purple-300/70">
                  {isAr ? 'سيتم احتساب الخسارة ومنح الفوز للخصم.' : 'Are you sure you want to forfeit this match to your opponent?'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResignModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[#2C1D4F] hover:bg-[#3B2868] text-purple-200 text-xs font-semibold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleConfirmResign}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {isAr ? 'تأكيد الاستسلام' : 'Confirm Resign'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draw Offer Modal */}
      <AnimatePresence>
        {showDrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              className="bg-[#1C1236] border border-[#442E70] p-5 rounded-3xl shadow-2xl max-w-xs w-full text-center space-y-3"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-300 flex items-center justify-center mx-auto">
                <Handshake size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'عرض التعادل؟' : isFr ? 'Proposer la nulle ?' : 'Offer a Draw?'}
                </h3>
                <p className="text-[11px] text-purple-300/70">
                  {isAiMode
                    ? isAr ? 'إنهاء المباراة بالتعادل الودي؟' : 'Agree to end this match in a peaceful draw?'
                    : isAr ? 'إرسال طلب تعادل إلى الخصم؟' : 'Send a draw agreement proposal to your opponent?'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDrawModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[#2C1D4F] hover:bg-[#3B2868] text-purple-200 text-xs font-semibold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleAcceptDrawAi}
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {isAr ? 'موافق' : 'Agree Draw'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1C1236] border border-[#442E70] p-5 rounded-3xl shadow-2xl max-w-xs w-full space-y-3"
            >
              <div className="flex items-center justify-between border-b border-purple-900/40 pb-2.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings size={16} className="text-purple-400" />
                  {isAr ? 'إعدادات الشطرنج' : 'Chess Settings'}
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-7 h-7 rounded-xl bg-[#2B1E4A] hover:bg-[#3A2A62] text-purple-300 flex items-center justify-center cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Board Theme Selection */}
                <div className="bg-[#110822] p-2.5 rounded-xl border border-[#2B1B48] space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-200">
                    <Palette size={15} />
                    <span>{isAr ? 'مظهر الرقعة' : 'Board Theme'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {(Object.keys(BOARD_THEMES) as BoardThemeKey[]).map((thmKey) => (
                      <button
                        key={thmKey}
                        onClick={() => setBoardTheme(thmKey)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                          boardTheme === thmKey
                            ? 'bg-[#2E1E50] border-purple-400 text-white shadow-sm'
                            : 'bg-[#180E2B] border-[#2A1B46] text-purple-300/70 hover:text-purple-200'
                        }`}
                      >
                        <div className="flex w-3.5 h-3.5 rounded overflow-hidden shrink-0 border border-white/20">
                          <div style={{ backgroundColor: BOARD_THEMES[thmKey].light }} className="w-1/2 h-full" />
                          <div style={{ backgroundColor: BOARD_THEMES[thmKey].dark }} className="w-1/2 h-full" />
                        </div>
                        <span className="truncate">{BOARD_THEMES[thmKey].name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sound toggle */}
                <div className="flex items-center justify-between bg-[#110822] p-2.5 rounded-xl border border-[#2B1B48]">
                  <div className="flex items-center gap-2 text-purple-200">
                    {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-rose-400" />}
                    <span>{isAr ? 'المؤثرات الصوتية' : 'Sound Effects'}</span>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      soundEnabled
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#2C1D4F] text-purple-300'
                    }`}
                  >
                    {soundEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Board coordinates toggle */}
                <div className="flex items-center justify-between bg-[#110822] p-2.5 rounded-xl border border-[#2B1B48]">
                  <div className="flex items-center gap-2 text-purple-200">
                    {showCoordinates ? <Eye size={15} /> : <EyeOff size={15} />}
                    <span>{isAr ? 'إحداثيات الرقعة' : 'Coordinates'}</span>
                  </div>
                  <button
                    onClick={() => setShowCoordinates(!showCoordinates)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      showCoordinates
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#2C1D4F] text-purple-300'
                    }`}
                  >
                    {showCoordinates ? 'SHOW' : 'HIDE'}
                  </button>
                </div>

                {/* AI Difficulty (if in AI mode) */}
                {isAiMode && (
                  <div className="flex items-center justify-between bg-[#110822] p-2.5 rounded-xl border border-[#2B1B48]">
                    <div className="flex items-center gap-2 text-purple-200">
                      <Bot size={15} />
                      <span>{isAr ? 'مستوى الصعوبة' : 'AI Level'}</span>
                    </div>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value as AiDifficulty)}
                      className="bg-[#2C1D4F] text-purple-200 border border-[#4B357F] rounded-lg px-2 py-0.5 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="easy">Easy (800)</option>
                      <option value="medium">Medium (1200)</option>
                      <option value="hard">Hard (1600)</option>
                      <option value="expert">Expert (2000)</option>
                    </select>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-Game Chat Drawer / Modal */}
      <AnimatePresence>
        {showChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowChatModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#180E2B] border-t sm:border border-[#442E70] rounded-t-3xl sm:rounded-3xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageCircle size={16} className="text-purple-400" />
                  {isAr ? 'محادثة الغرفة' : 'In-Game Chat'}
                </h3>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="w-8 h-8 rounded-xl bg-[#281A46] hover:bg-[#38265E] text-purple-300 flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {joinedRoom ? (
                <div className="flex-1 min-h-[280px] overflow-hidden flex flex-col">
                  <RoomChat />
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-purple-300/70">
                    {isAr ? 'اللعب ضد الروبوت. أرسل تفاعلاً سريعاً:' : 'Playing against Rakcha Bot. Send a quick emote:'}
                  </p>
                  <div className="flex justify-center gap-3 text-2xl pt-2">
                    {['👋', '😎', '🤝', '⚡', '🧠', '👑'].map((em) => (
                      <button
                        key={em}
                        onClick={() => setShowChatModal(false)}
                        className="p-2 rounded-2xl bg-[#281A46] hover:bg-[#38265E] border border-[#442E70] transition-all active:scale-95 cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ChessGameView = React.memo(ChessGameViewComponent);
