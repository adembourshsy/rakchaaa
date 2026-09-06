import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Clock,
  Shield,
  Award,
  Check,
  Zap,
  HelpCircle,
  UserX,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';
import { GameCard, CardCategory, RoomPlayer } from '../../types';
import { getAvatarUrl, DEFAULT_AVATAR } from '../../data/mockData';
import { audioManager } from '../../services/audioManager';

interface MainGameCardProps {
  card: GameCard | null;
  isFlipped: boolean;
  isActiveTurn: boolean;
  activePlayerName: string;
  timerSeconds: number;
  shieldsCount: number;
  selectedSpecialChoice: 'optionA' | 'optionB' | null;
  selectedTargetPlayerId: string | null;
  specialActionStep: 'choose_action' | 'choose_player' | 'confirm_remove' | 'show_question' | 'completed' | null;
  specialCardOwnerId: string | null;
  currentUserId: string | null;
  shieldUsedInTurn: boolean;
  onFlipCard: () => void;
  onUseShield: () => void;
  onSelectSpecialChoice: (choice: 'optionA' | 'optionB') => void;
  onUpdateSpecialStep: (step: 'choose_action' | 'choose_player' | 'confirm_remove' | 'show_question' | 'completed') => void;
  onSelectTargetPlayer: (playerId: string) => void;
  onAdvanceTurn: () => void;
  previewMode?: boolean; // For Admin Card Preview!
  players?: RoomPlayer[];
  activePlayerId?: string;
  onRemovePlayer?: (playerId: string) => void;
}

const EMBARRASSING_QUESTIONS = [
  'أحرج بحث عملتو في تليفونك هذا الجمعة شنوة؟',
  'شكون من اللي هنا ما تحبش تبقى معاه وحدك في جزيرة، وعلاش؟',
  'ورّينا آخر مسج بعثتو، وإلا حكيلنا أخيب موعد عملتو.',
  'شنوة العادة اللي تعملها في الدار وحتّى حد هنا ما يعرفها؟',
  'لوكان تخلّص 500 دينار باش تخبّي سر، شنوة يكون هذا السر؟',
  'شكون آخر شخص شمّمت فيه في التليفون وما جاوبتوش؟',
]

// أوامر/تحدّيات بالتونسي كي يختار اللاعب "احكم على شكون"
const TUNISIAN_DARES = [
  'غنّي مقطع من أغنية بصوت عالي قدّام الجماعة.',
  'قلّد شكون من اللي هنا حتى يعرفوه.',
  'إبعث مسج "نحبّك" لآخر شخص كلّمتو في التليفون.',
  'اتكلّم بالفرنساوي كي تجي دورتك حتى تكمل اللعبة.',
  'إعمل 10 تمارين ضغط توّة.',
  'خلّي حد من الجماعة يكتب ستاتوس في تليفونك.',
]

export const MainGameCard: React.FC<MainGameCardProps> = memo(({
  card,
  isFlipped,
  isActiveTurn,
  activePlayerName,
  timerSeconds,
  shieldsCount,
  selectedSpecialChoice,
  shieldUsedInTurn,
  onFlipCard,
  onUseShield,
  onSelectSpecialChoice,
  onAdvanceTurn,
  previewMode = false,
  players = [],
  activePlayerId,
  onRemovePlayer,
}) => {
  if (!card) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-8 text-center">
        <div className="w-10 h-10 border-4 border-[#FF5436] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Chargement de la carte...</p>
      </div>
    );
  }

  // Fallback player list if room players are empty
  const roomPlayersList: RoomPlayer[] =
    players.length > 0
      ? players
      : [
          {
            id: 'usr-current',
            name: 'You',
            username: '@you',
            avatarUrl: DEFAULT_AVATAR,
            isHost: true,
            isReady: true,
          },
          {
            id: 'bot-1',
            name: 'Yassine',
            username: '@yassine_af',
            avatarUrl:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            isHost: false,
            isReady: true,
          },
          {
            id: 'bot-2',
            name: 'Amira',
            username: '@amira_hub',
            avatarUrl:
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
            isHost: false,
            isReady: true,
          },
          {
            id: 'bot-3',
            name: 'Sami',
            username: '@sami_hero',
            avatarUrl:
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
            isHost: false,
            isReady: true,
          },
        ];

  // Special Card interaction internal step:
  // 'choose_action' -> 'choose_player' -> 'confirm_remove' | 'show_question' -> 'executed'
  const [specialStep, setSpecialStep] = useState<
    'choose_action' | 'choose_player' | 'confirm_remove' | 'show_question' | 'executed'
  >('choose_action');

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [promptPool, setPromptPool] = useState<string[]>(EMBARRASSING_QUESTIONS);
  const [removedNotification, setRemovedNotification] = useState<string | null>(null);

  // Reset internal special step state when card changes or when card is unflipped
  useEffect(() => {
    if (!isFlipped) {
      setSpecialStep('choose_action');
      setSelectedTargetId(null);
      setRemovedNotification(null);
    }
  }, [isFlipped, card.id]);

  // Synchronize internal step if selectedSpecialChoice is changed
  useEffect(() => {
    if (card.category === 'special' && selectedSpecialChoice && specialStep === 'choose_action') {
      setSpecialStep('choose_player');
    }
  }, [selectedSpecialChoice, card.category]);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Category Theme Config
  const categoryConfig: Record<
    CardCategory,
    {
      label: string;
      icon: React.ElementType;
      badgeBg: string;
      badgeText: string;
      borderColor: string;
      glowColor: string;
      accentBg: string;
    }
  > = {
    action: {
      label: 'ACTION',
      icon: Zap,
      badgeBg: 'bg-red-500/15 border border-red-500/30',
      badgeText: 'text-red-500 dark:text-red-400',
      borderColor: 'border-2 border-red-500/80 dark:border-red-500/90',
      glowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
      accentBg: 'bg-red-500',
    },
    truth: {
      label: 'TRUTH',
      icon: HelpCircle,
      badgeBg: 'bg-amber-400/15 border border-amber-400/30',
      badgeText: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-2 border-amber-400/80 dark:border-amber-400/90',
      glowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      accentBg: 'bg-amber-400',
    },
    shield: {
      label: 'SHIELD',
      icon: Shield,
      badgeBg: 'bg-emerald-500/15 border border-emerald-500/30',
      badgeText: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-2 border-emerald-500/80 dark:border-emerald-500/90',
      glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      accentBg: 'bg-emerald-500',
    },
    special: {
      label: 'SPECIAL',
      icon: Award,
      badgeBg: 'bg-purple-500/15 border border-purple-500/30',
      badgeText: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-2 border-transparent bg-origin-border',
      glowColor: 'shadow-[0_0_25px_rgba(168,85,247,0.2)]',
      accentBg: 'bg-purple-500',
    },
  };

  const config = categoryConfig[card.category] || categoryConfig.action;
  const CategoryIcon = config.icon;

  const currentChoiceText =
    selectedSpecialChoice === 'optionB'
      ? card.specialOptions?.optionB || 'تسأل / تحكم على لاعب'
      : card.specialOptions?.optionA || 'تخرّج لاعب من اللعبة';

  const isRemoveAction = selectedSpecialChoice === 'optionA';

  const selectedTargetPlayer = roomPlayersList.find((p) => p.id === selectedTargetId);

  // Handle Choice Selection
  const handleChoiceClick = (choice: 'optionA' | 'optionB') => {
    onSelectSpecialChoice(choice);
    setSpecialStep('choose_player');
    setSelectedTargetId(null);
  };

  // Handle Target Confirmation
  const handleConfirmTarget = () => {
    if (!selectedTargetId) return;

    if (isRemoveAction) {
      setSpecialStep('confirm_remove');
    } else {
      // Embarrassing Question action
      const pool = Math.random() < 0.5 ? EMBARRASSING_QUESTIONS : TUNISIAN_DARES;
      setPromptPool(pool);
      setQuestionIndex(Math.floor(Math.random() * pool.length));
      setSpecialStep('show_question');
    }
  };

  // Execute Remove Player Action
  const handleExecuteRemove = () => {
    if (!selectedTargetId) return;
    const targetObj = roomPlayersList.find((p) => p.id === selectedTargetId);
    if (onRemovePlayer) {
      onRemovePlayer(selectedTargetId);
    }
    setRemovedNotification(`${targetObj?.name || targetObj?.username || 'اللاعب'} خرج من اللعبة`);
    setSpecialStep('executed');
  };

  // Check if Special Card requirements are met before allowing turn completion
  const isSpecialCardReadyToAdvance =
    card.category !== 'special' || specialStep === 'executed' || specialStep === 'show_question';

  return (
    <div className="w-full max-w-sm mx-auto space-y-3.5 select-none">
      {/* 3D Flip Card Container with fluid aspect & max-height limits for small mobile displays */}
      <div className="relative w-full aspect-[4/5] min-h-[270px] max-h-[48dvh] sm:max-h-[520px] perspective-[1200px]">
        <motion.div
          className="w-full h-full relative duration-500 [transform-style:preserve-3d]"
          animate={{ rotateY: isFlipped || previewMode ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ================= BACK OF CARD (HIDDEN STATE) ================= */}
          <div className="absolute inset-0 w-full h-full rounded-[28px] bg-gradient-to-br from-[#352208] via-[#463013] to-[#251704] border-2 border-[#E1BB80] p-5 flex flex-col items-center justify-between shadow-[0_20px_50px_rgba(53,34,8,0.5)] [backface-visibility:hidden] relative overflow-hidden text-[#FFF5E6]">
            {/* Inner Decorative Physical Frame Line */}
            <div className="absolute inset-2.5 rounded-[20px] border border-dashed border-[#E1BB80]/40 pointer-events-none" />

            {/* Corner Gold Accent Symbols */}
            <div className="absolute top-4 left-4 text-[#E1BB80] font-mono text-[10px] font-bold">♠</div>
            <div className="absolute top-4 right-4 text-[#E1BB80] font-mono text-[10px] font-bold">◆</div>
            <div className="absolute bottom-4 left-4 text-[#E1BB80] font-mono text-[10px] font-bold">♥</div>
            <div className="absolute bottom-4 right-4 text-[#E1BB80] font-mono text-[10px] font-bold">♣</div>

            {/* Top Branding Header */}
            <div className="w-full flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-[#E1BB80] uppercase z-10 pt-1">
              <span className="font-bold">RAKCHA GAME</span>
              <span>DECK • CARD</span>
            </div>

            {/* Central Animated Physical Emblem */}
            <div className="flex flex-col items-center justify-center space-y-4 my-auto z-10">
              <div className="w-20 h-20 rounded-full bg-[#352208] border-2 border-[#E1BB80] flex items-center justify-center relative shadow-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E1BB80] to-[#C59B58] flex items-center justify-center text-[#352208] font-mono font-black text-sm tracking-widest shadow-md">
                  AF
                </div>
                {/* Subtle Gold Pulse Ring */}
                <div className="absolute inset-0 rounded-full ring-2 ring-[#E1BB80]/50 animate-ping opacity-30 pointer-events-none" />
              </div>

              <div className="text-center space-y-1.5">
                <div className="inline-block px-3.5 py-1 rounded-full bg-[#E1BB80]/20 text-[#E1BB80] border border-[#E1BB80]/40 text-[10px] font-mono font-bold uppercase tracking-widest shadow-xs">
                  {activePlayerName}'S TURN
                </div>
                <p className="text-[10px] font-mono text-[#D5B585]">
                  Tap 'FLIP CARD' to reveal challenge
                </p>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="w-full text-center text-[9px] font-mono text-[#E1BB80]/70 tracking-wider uppercase z-10 pb-1">
              OFFICIAL RAKCHA DECK
            </div>
          </div>

              {/* ================= FRONT OF CARD (REVEALED STATE) ================= */}
          <div
            className={`absolute inset-0 w-full h-full rounded-[28px] p-[2.5px] shadow-[0_20px_50px_rgba(0,0,0,0.22)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.75)] [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden transition-all duration-300 ${
              card.category === 'special'
                ? 'bg-gradient-to-tr from-[#FF5436] via-[#FFB800] to-orange-600 shadow-[0_0_30px_rgba(255,84,54,0.3)]'
                : card.category === 'action'
                ? 'bg-gradient-to-b from-red-500 via-red-500/80 to-red-600 shadow-[0_0_25px_rgba(239,68,68,0.2)]'
                : card.category === 'truth'
                ? 'bg-gradient-to-b from-amber-400 via-amber-500/80 to-amber-600 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                : 'bg-gradient-to-b from-emerald-400 via-emerald-500/80 to-emerald-600 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
            }`}
          >
            {/* Inner Content Surface */}
            <div className="w-full h-full rounded-[25px] bg-white dark:bg-[#151A28] p-4 sm:p-5 flex flex-col justify-between overflow-y-auto relative">
              {/* Subtle Ambient Decorative Corner Highlights */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none ${
                  card.category === 'special'
                    ? 'bg-[#FF5436]'
                    : card.category === 'action'
                    ? 'bg-red-500'
                    : card.category === 'truth'
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
              />

              {/* Top Header Row: Category Badge & Countdown Timer */}
              <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 relative z-10">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.badgeBg} ${config.badgeText} text-[10px] font-mono font-bold uppercase tracking-wider shadow-2xs`}
                >
                  <CategoryIcon size={12} />
                  <span>{config.label}</span>
                </div>

                {!previewMode && (
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs font-bold transition-colors ${
                      timerSeconds <= 30
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse'
                        : 'bg-black/5 dark:bg-white/10 text-[#0F172A] dark:text-[#F8FAFC] border border-black/5 dark:border-white/10'
                    }`}
                  >
                    <Clock size={12} className={timerSeconds <= 30 ? 'text-red-500' : 'text-[#FF5436] dark:text-[#FFB800]'} />
                    <span>{formatTime(timerSeconds)}</span>
                  </div>
                )}
              </div>

              {/* Main Body Content */}
              <div className="my-auto py-2 space-y-3 text-left relative z-10">
                {/* Standard Non-Special Cards or Initial Special Header */}
                {card.category !== 'special' && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest">
                          {card.title}
                        </span>
                        <span className="text-[9px] font-mono text-[#64748B]/60 dark:text-[#94A3B8]/60 uppercase">
                          CARD #{card.id.slice(-4)}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug sm:leading-relaxed tracking-tight">
                        {card.content}
                      </h3>
                    </div>

                    {/* Integrated Optional Image Display for Any Card */}
                    {card.imageUrl && (
                      <div className="relative w-full h-32 sm:h-36 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 my-2 shadow-xs group">
                        <img loading="lazy" decoding="async" src={card.imageUrl}
                          alt={card.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      </div>
                    )}

                    {/* Optional Guidelines / Description Box */}
                    {card.description && (
                      <p className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8] bg-black/5 dark:bg-white/5 p-2.5 rounded-xl border border-black/5 dark:border-white/10 leading-relaxed">
                        {card.description}
                      </p>
                    )}
                  </>
                )}

                {/* ============================================================== */}
                {/* SPECIAL CARD TARGET PLAYER SELECTION FLOW                       */}
                {/* ============================================================== */}
                {card.category === 'special' && (
                  <AnimatePresence mode="wait">
                    {/* STEP 1: CHOOSE ACTION (OPTION A or OPTION B) */}
                    {specialStep === 'choose_action' && (
                      <motion.div
                        key="step-action"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-3"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-[#FF5436] dark:text-[#FFB800] uppercase tracking-widest flex items-center gap-1.5">
                            <span>كارت خاص • خيارين</span>
                          </span>
                          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                            شنوة تحب تعمل؟
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-1">
                          <button
                            onClick={() => handleChoiceClick('optionA')}
                            className={`w-full p-3 rounded-2xl border text-xs font-mono text-left transition-all flex items-center justify-between group cursor-pointer ${
                              selectedSpecialChoice === 'optionA'
                                ? 'border-[#FF5436] bg-[#FF5436]/15 text-[#FF5436] dark:text-[#FFB800] font-bold'
                                : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#0F172A] dark:text-[#F8FAFC] hover:border-[#FF5436]/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#FF5436]/20 text-[#FF5436] dark:text-[#FFB800] flex items-center justify-center font-bold text-xs">
                                1
                              </div>
                              <span className="font-semibold">
                                {card.specialOptions?.optionA || 'تخرّج شكون من اللعبة'}
                              </span>
                            </div>
                            <UserX size={15} className="text-red-500 opacity-80" />
                          </button>

                          <button
                            onClick={() => handleChoiceClick('optionB')}
                            className={`w-full p-3 rounded-2xl border text-xs font-mono text-left transition-all flex items-center justify-between group cursor-pointer ${
                              selectedSpecialChoice === 'optionB'
                                ? 'border-[#FF5436] bg-[#FF5436]/15 text-[#FF5436] dark:text-[#FFB800] font-bold'
                                : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#0F172A] dark:text-[#F8FAFC] hover:border-[#FF5436]/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                                2
                              </div>
                              <span className="font-semibold">
                                {card.specialOptions?.optionB || 'تسأل / تحكم على شكون'}
                              </span>
                            </div>
                            <HelpCircle size={15} className="text-purple-500 opacity-80" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2: TARGET PLAYER SELECTION ("Choose a player") */}
                    {specialStep === 'choose_player' && (
                      <motion.div
                        key="step-target"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-3"
                      >
                        {/* Title and Active Action Badge */}
                        <div className="flex items-center justify-between pb-1">
                          <div>
                            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                              {isRemoveAction ? 'شكون تحب تخرّج من اللعبة؟' : 'شكون تحب تختار؟'}
                            </h3>
                            <p className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                              {isRemoveAction
                                ? 'اللي تختارو يخرج من اللعبة كامل'
                                : 'اختار اللاعب اللي باش تسألو / تحكم عليه'}
                            </p>
                          </div>

                          <button
                            onClick={() => setSpecialStep('choose_action')}
                            className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
                            title="Change special action"
                          >
                            <ArrowLeft size={13} />
                          </button>
                        </div>

                        {/* Eligible Players List */}
                        <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                          {roomPlayersList.map((p, idx) => {
                            const isCurrentIssuer =
                              p.id === activePlayerId ||
                              p.name === activePlayerName ||
                              p.username === '@you' ||
                              (activePlayerId === undefined && p.id === 'usr-current');

                            const isSelected = selectedTargetId === p.id;

                            return (
                              <button
                                key={`target-${p.id}-${idx}`}
                                disabled={isCurrentIssuer}
                                onClick={() => setSelectedTargetId(p.id)}
                                className={`w-full p-2.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                                  isCurrentIssuer
                                    ? 'opacity-40 bg-black/5 dark:bg-white/5 border-black/5 cursor-not-allowed'
                                    : isSelected
                                    ? 'border-2 border-[#FF5436] bg-[#FF5436]/15 shadow-sm'
                                    : 'border-black/10 dark:border-white/10 bg-white dark:bg-[#151A28] hover:border-[#FF5436]/50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {/* Circular Profile Avatar */}
                                  <div className="relative">
                                    <img loading="lazy" decoding="async" src={getAvatarUrl(p.avatarUrl)}
                                      alt={p.name}
                                      className={`w-9 h-9 rounded-full object-cover border ${
                                        isSelected ? 'border-[#FF5436]' : 'border-black/10 dark:border-white/10'
                                      }`}
                                    />
                                    {isSelected && (
                                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#FF5436] text-white flex items-center justify-center">
                                        <Check size={9} strokeWidth={3} />
                                      </div>
                                    )}
                                  </div>

                                  {/* User Details */}
                                  <div className="text-left truncate">
                                    <p className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                                      {p.name}
                                    </p>
                                    <p className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] truncate">
                                      {p.username}
                                    </p>
                                  </div>
                                </div>

                                {/* Selection Badge / Issuer Status */}
                                {isCurrentIssuer ? (
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[#64748B] dark:text-[#94A3B8]">
                                    YOU
                                  </span>
                                ) : isSelected ? (
                                  <span className="text-[10px] font-mono font-bold text-white bg-[#FF5436] px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Check size={11} /> TARGET
                                  </span>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border border-black/20 dark:border-white/20 flex items-center justify-center text-transparent">
                                    ✓
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Primary Action Button: "CONFIRM" */}
                        <button
                          onClick={handleConfirmTarget}
                          disabled={!selectedTargetId}
                          className={`w-full py-3 rounded-2xl text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            selectedTargetId
                              ? 'bg-[#FF5436] text-white hover:opacity-95 shadow-md shadow-[#FF5436]/20 active:scale-98'
                              : 'bg-black/10 dark:bg-white/10 text-[#64748B]/40 dark:text-[#94A3B8]/40 cursor-not-allowed'
                          }`}
                        >
                          <Check size={14} />
                          <span>{isRemoveAction ? "خرّجو" : "أكّد"}</span>
                        </button>
                      </motion.div>
                    )}

                    {/* STEP 3A: CONFIRM REMOVE PLAYER FLOW */}
                    {specialStep === 'confirm_remove' && selectedTargetPlayer && (
                      <motion.div
                        key="step-confirm-remove"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-4 text-center py-1"
                      >
                        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/15 text-red-500 flex items-center justify-center border border-red-500/30">
                          <UserX size={26} />
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                            متأكّد تحب تخرّج {selectedTargetPlayer.name} من اللعبة؟
                          </h3>
                          <p className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                            {selectedTargetPlayer.name} باش يخرج من الڨايم كامل وما يلعبش معاكم زادة.
                          </p>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setSpecialStep('choose_player')}
                            className="flex-1 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#0F172A] dark:text-[#F8FAFC] text-xs font-mono font-bold tracking-wider uppercase hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            رجوع
                          </button>
                          <button
                            onClick={handleExecuteRemove}
                            className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors shadow-md shadow-red-500/20 active:scale-98 cursor-pointer"
                          >
                            أيّه، خرّجو
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3B: EMBARRASSING QUESTION DISPLAY */}
                    {specialStep === 'show_question' && selectedTargetPlayer && (
                      <motion.div
                        key="step-question"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        {/* Target Banner Indicator */}
                        <div className="p-2.5 rounded-2xl bg-[#FF5436]/20 border border-[#FF5436]/50 flex items-center gap-2.5">
                          <img loading="lazy" decoding="async" src={selectedTargetPlayer.avatarUrl}
                            alt={selectedTargetPlayer.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#FF5436]"
                          />
                          <div className="text-left">
                            <span className="text-[9px] font-mono font-bold text-[#FF5436] dark:text-[#FFB800] uppercase tracking-wider block">
                              اللاعب المختار
                            </span>
                            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                              {selectedTargetPlayer.name} هو المستهدف
                            </span>
                          </div>
                        </div>

                        {/* Embarrassing Question Prompt */}
                        <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-1.5 text-left">
                          <div className="flex items-center gap-1.5 text-[#FF5436] dark:text-[#FFB800] text-[10px] font-mono font-bold uppercase">
                            <HelpCircle size={12} />
                            <span>{isRemoveAction ? "سؤال محرج" : "سؤال / حُكم"}</span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC] leading-relaxed">
                            "{promptPool[questionIndex] || EMBARRASSING_QUESTIONS[0]}"
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 4: EXECUTION DONE */}
                    {specialStep === 'executed' && (
                      <motion.div
                        key="step-executed"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold space-y-1 text-center"
                      >
                        <div className="flex items-center justify-center gap-1.5 font-bold">
                          <UserCheck size={16} />
                          <span>تنفّذ الأكشن الخاص</span>
                        </div>
                        {removedNotification && (
                          <p className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                            {removedNotification}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                {/* SHIELD USAGE CONFIRMATION */}
                {shieldUsedInTurn && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold flex items-center justify-center gap-2"
                  >
                    <Shield size={16} />
                    <span>استعملت الكارت الأخضر! ما تجاوبش... الدور يتعدّى</span>

                  </motion.div>
                )}
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[9px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase">
                <span>RAKCHA GAME • DECK</span>
                <span>CARD ID: {card.id.slice(-6)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ================= IN-GAME CONTROLS BELOW CARD ================= */}
      {!previewMode && (
        <div className="space-y-2 pt-1">
          {!isFlipped ? (
            <button
              onClick={() => {
                audioManager.playCardPick();
                try {
                  confetti({
                    particleCount: 30,
                    spread: 60,
                    origin: { y: 0.65 },
                    colors: ['#FF5436', '#FFB800', '#10B981', '#A855F7'],
                  });
                } catch (e) {
                  // ignore if canvas unavailable
                }
                onFlipCard();
              }}
              disabled={!isActiveTurn}
              className={`w-full py-3.5 min-h-[48px] rounded-2xl text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 touch-manipulation cursor-pointer ${
                isActiveTurn
                  ? 'bg-[#FF5436] text-white hover:opacity-95 shadow-[#FF5436]/20'
                  : 'bg-black/10 dark:bg-white/10 text-[#64748B]/40 dark:text-[#94A3B8]/40 cursor-not-allowed'
              }`}
            >
              <Zap size={15} />
              <span>{isActiveTurn ? 'FLIP CARD' : `WAITING FOR ${activePlayerName}`}</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Green (Shield) card: usable any time you are the active player, on any card type */}
              {shieldsCount > 0 && !shieldUsedInTurn && isActiveTurn && (
                <button
                  onClick={() => {
                    try {
                      confetti({
                        particleCount: 45,
                        spread: 80,
                        origin: { y: 0.6 },
                        colors: ['#10B981', '#34D399', '#059669'],
                      });
                    } catch (e) {}
                    onUseShield();
                  }}
                  className="w-full py-3 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs active:scale-98 touch-manipulation cursor-pointer"
                >
                  <Shield size={14} />
                  <span>استعمل الكارت الأخضر — ما تجاوبش (× {shieldsCount})</span>
                </button>
              )}


              {/* Advance Turn Button (Only enabled when Special Card action target is complete and it is active player's turn) */}
              <button
                onClick={() => {
                  audioManager.playCardPlace();
                  onAdvanceTurn();
                }}
                disabled={!isActiveTurn || !isSpecialCardReadyToAdvance}
                className={`w-full py-3.5 min-h-[48px] rounded-2xl text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-sm touch-manipulation cursor-pointer ${
                  isActiveTurn && isSpecialCardReadyToAdvance
                    ? 'bg-[#FF5436] text-white hover:opacity-90 active:scale-98 font-bold'
                    : 'bg-black/10 dark:bg-white/10 text-[#64748B]/40 dark:text-[#94A3B8]/40 cursor-not-allowed'
                }`}
              >
                <span>
                  {!isActiveTurn
                    ? `WAITING FOR ${activePlayerName}`
                    : card.category === 'special' && !isSpecialCardReadyToAdvance
                    ? 'SELECT TARGET PLAYER TO CONTINUE'
                    : 'COMPLETE TURN & PASS DECK'}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

MainGameCard.displayName = 'MainGameCard';

