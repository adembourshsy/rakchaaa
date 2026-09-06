import React, { useState, useRef } from 'react';
import {
  Globe,
  Lock,
  Users,
  BrainCircuit,
  ArrowRight,
  Clock,
  Zap,
  Flame,
  Hourglass,
  Infinity,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SetupModal, PrimaryButton } from '../ui';
import { EntryCostSelector } from '../ui/EntryCostSelector';
import { CHESS_TIME_OPTIONS, ChessTimeControlOption } from '../../services/chessEngine';
import { ChessTimeOptionId } from '../../types';

interface ChessSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
}

export const ChessSetupModal: React.FC<ChessSetupModalProps> = ({
  isOpen,
  onClose,
  isEditMode = false,
}) => {
  const {
    createRoom,
    updateRoomParameters,
    startAiChessGame,
    joinedRoom,
    language,
    chessSettings,
    setChessSettings,
  } = useApp();

  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const [selectedCategory, setSelectedCategory] = useState<'friends' | 'ai'>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');
  const [selectedTimeId, setSelectedTimeId] = useState<ChessTimeOptionId>(
    (joinedRoom?.chessSettings?.timeControlId as ChessTimeOptionId) ||
      chessSettings?.timeControlId ||
      '5m'
  );
  const [isPrivate, setIsPrivate] = useState<boolean>(joinedRoom ? joinedRoom.isPrivate : false);
  const [entryCost, setEntryCost] = useState<number>(joinedRoom?.entryCost ?? 30);

  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  if (!isOpen) return null;

  const selectedTimeControl: ChessTimeControlOption =
    CHESS_TIME_OPTIONS.find((opt) => opt.id === selectedTimeId) || CHESS_TIME_OPTIONS[3];

  const handleStart = async () => {
    if (isSubmittingRef.current || isCreating) return;
    isSubmittingRef.current = true;
    setIsCreating(true);
    setErrorMessage(null);

    const chosenSettings = {
      timeControlId: selectedTimeControl.id as ChessTimeOptionId,
      initialSeconds: selectedTimeControl.initialSeconds,
      incrementSeconds: selectedTimeControl.incrementSeconds,
    };

    // Update context settings for future defaults
    setChessSettings(chosenSettings);

    try {
      if (selectedCategory === 'ai') {
        startAiChessGame({
          difficulty: aiDifficulty,
          timeControlId: chosenSettings.timeControlId,
          initialSeconds: chosenSettings.initialSeconds,
          incrementSeconds: chosenSettings.incrementSeconds,
        });
        onClose();
      } else {
        if (isEditMode && joinedRoom) {
          await updateRoomParameters({
            isPrivate,
            chessSettings: chosenSettings,
          });
        } else {
          await createRoom(
            'chess',
            2,
            isPrivate,
            'friends',
            'virtual',
            undefined,
            entryCost,
            false,
            chosenSettings
          );
        }
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to start Chess game:', err);
      setErrorMessage(
        err?.message ||
          (isAr
            ? 'تعذر بدء لعبة الشطرنج. يرجى المحاولة مرة أخرى.'
            : isFr
            ? 'Impossible de démarrer la partie d\'échecs. Veuillez réessayer.'
            : 'Failed to start Chess game. Please try again.')
      );
    } finally {
      setIsCreating(false);
      isSubmittingRef.current = false;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bullet':
        return <Zap size={14} className="text-amber-400" />;
      case 'blitz':
        return <Flame size={14} className="text-orange-400" />;
      case 'rapid':
        return <Clock size={14} className="text-emerald-400" />;
      case 'classical':
        return <Hourglass size={14} className="text-blue-400" />;
      default:
        return <Infinity size={14} className="text-purple-400" />;
    }
  };

  return (
    <SetupModal
      isOpen={isOpen}
      onClose={onClose}
      title={isAr ? 'إعدادات لعبة الشطرنج' : isFr ? 'Configuration des Échecs' : 'Grandmaster Chess Setup'}
      subtitle={
        isAr
          ? 'اختر نمط اللعب والتحكم في الوقت'
          : isFr
          ? 'Choisissez le mode de jeu et le contrôle du temps'
          : 'Choose game mode and time control'
      }
      errorMessage={errorMessage}
      footer={
        <PrimaryButton
          onClick={handleStart}
          disabled={isCreating}
          className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <span>
            {isCreating
              ? (isAr ? 'جاري البدء...' : 'Starting...')
              : (isAr ? 'بدء اللعبة الآن' : isFr ? 'Démarrer la Partie' : 'Start Match Now')}
          </span>
          <ArrowRight size={16} />
        </PrimaryButton>
      }
    >
      <div className="space-y-5">
        {/* Category Selection: Friends vs AI */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            {isAr ? 'نمط اللعب' : isFr ? 'Mode de Jeu' : 'Game Mode'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedCategory('ai')}
              className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                selectedCategory === 'ai'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold shadow-lg shadow-amber-500/10'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BrainCircuit size={22} className={selectedCategory === 'ai' ? 'text-amber-400' : 'text-slate-400'} />
              <div className="text-center">
                <div className="text-sm font-bold">
                  {isAr ? 'الذكاء الاصطناعي' : isFr ? 'Mode IA (Solo)' : 'Play vs AI (Solo)'}
                </div>
                <div className="text-[10px] text-slate-400 font-normal">
                  {isAr ? 'العب ضد البوت مع التراجع' : isFr ? 'Jouer contre le bot avec retour' : 'Play vs bot with undo'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('friends')}
              className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                selectedCategory === 'friends'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold shadow-lg shadow-amber-500/10'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Users size={22} className={selectedCategory === 'friends' ? 'text-amber-400' : 'text-slate-400'} />
              <div className="text-center">
                <div className="text-sm font-bold">
                  {isAr ? 'مع الأصدقاء' : isFr ? 'Mode Amis (1v1)' : 'Play Friends (1v1)'}
                </div>
                <div className="text-[10px] text-slate-400 font-normal">
                  {isAr ? 'تحدي لاعب حقيقي أونلاين' : isFr ? 'Défier un ami en ligne' : 'Challenge a real player'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* AI Difficulty Options if AI mode */}
        {selectedCategory === 'ai' && (
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              {isAr ? 'مستوى الذكاء الاصطناعي' : isFr ? 'Difficulté de l\'IA' : 'AI Difficulty'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['easy', 'medium', 'hard', 'expert'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setAiDifficulty(diff)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-bold capitalize transition-all cursor-pointer text-center ${
                    aiDifficulty === diff
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {diff === 'easy' ? (isAr ? 'سهل' : isFr ? 'Facile' : 'Easy') :
                   diff === 'medium' ? (isAr ? 'متوسط' : isFr ? 'Moyen' : 'Medium') :
                   diff === 'hard' ? (isAr ? 'صعب' : isFr ? 'Difficile' : 'Hard') :
                   (isAr ? 'خبير' : isFr ? 'Expert' : 'Expert')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time Control Selection */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-amber-400" />
              <span>{isAr ? 'التحكم بالوقت (ساعة الشطرنج)' : isFr ? 'Cadence / Pendule' : 'Time Control (Chess Clock)'}</span>
            </label>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
              {isAr ? selectedTimeControl.nameAr : isFr ? selectedTimeControl.nameFr : selectedTimeControl.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {CHESS_TIME_OPTIONS.map((opt) => {
              const isSelected = selectedTimeId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedTimeId(opt.id as ChessTimeOptionId)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? 'bg-amber-500/20' : 'bg-slate-700/50'}`}>
                      {getCategoryIcon(opt.category)}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className={`text-xs font-bold truncate ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                        {isAr ? opt.nameAr : isFr ? opt.nameFr : opt.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {opt.initialSeconds === 0
                          ? (isAr ? 'بدون حد زمني' : 'No clock limit')
                          : opt.incrementSeconds > 0
                          ? `+${opt.incrementSeconds}s ${isAr ? 'إضافة' : 'increment'}`
                          : (isAr ? 'وقت ثابت' : 'Fixed time')}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="shrink-0 text-amber-400 ml-1">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Friends Mode Options if Friends mode */}
        {selectedCategory === 'friends' && (
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center gap-3">
                {isPrivate ? <Lock size={18} className="text-amber-400" /> : <Globe size={18} className="text-emerald-400" />}
                <div>
                  <div className="text-xs font-bold text-white">
                    {isPrivate ? (isAr ? 'غرفة خاصة' : isFr ? 'Salle Privée' : 'Private Room') : (isAr ? 'غرفة عامة' : isFr ? 'Salle Publique' : 'Public Room')}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isPrivate ? (isAr ? 'تتطلب رمز سري للدخول' : isFr ? 'Nécessite un code secret' : 'Requires secret code') : (isAr ? 'مفتوحة للجميع' : isFr ? 'Ouverte à tous' : 'Open to everyone')}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${isPrivate ? 'bg-amber-500' : 'bg-slate-700'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${isPrivate ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>

            <EntryCostSelector selectedCost={entryCost} onSelectCost={setEntryCost} />
          </div>
        )}
      </div>
    </SetupModal>
  );
};
