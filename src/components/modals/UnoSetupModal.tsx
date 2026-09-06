import React, { useState, useRef } from 'react';
import { Globe, Lock, Users, ArrowRight, Layers, Gamepad2, Sliders } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SetupModal, PrimaryButton } from '../ui';
import { EntryCostSelector } from '../ui/EntryCostSelector';

interface UnoSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
}

export const UnoSetupModal: React.FC<UnoSetupModalProps> = ({
  isOpen,
  onClose,
  isEditMode = false,
}) => {
  const { joinedRoom, createRoom, updateRoomParameters, startAiUnoGame, language } = useApp();

  const isAr = language === 'ar';
  const isFr = language === 'fr';

  // Mode Selection: 'friends' (Multiplayer via Firestore) vs 'ai' (Local solo vs AI)
  const [selectedCategory, setSelectedCategory] = useState<'friends' | 'ai'>('friends');

  // Friends Mode States
  const [isPrivate, setIsPrivate] = useState<boolean>(joinedRoom ? joinedRoom.isPrivate : false);
  const [maxPlayers, setMaxPlayers] = useState<number>(joinedRoom?.maxPlayers || 4);
  const UNO_MAX_PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const [entryCost, setEntryCost] = useState<number>(joinedRoom?.entryCost ?? 30);

  // AI Mode States
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');
  const [aiCount, setAiCount] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(3);
  const UNO_AI_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  if (!isOpen) return null;

  const handleStartFriendsRoom = async () => {
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode && joinedRoom) {
        await updateRoomParameters({
          isPrivate,
          maxPlayers,
        });
      } else {
        await createRoom(
          'uno-game',
          maxPlayers,
          isPrivate,
          'friends',
          'virtual',
          undefined,
          entryCost
        );
      }
      onClose();
    } catch (err: any) {
      console.error('UNO setup error:', err);
      setError(
        err?.message ||
          (isAr
            ? 'حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مجددًا.'
            : isFr
            ? 'Erreur lors de l\'enregistrement. Veuillez réessayer.'
            : 'Failed to setup UNO room. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleStartAiMatch = () => {
    startAiUnoGame({
      difficulty: aiDifficulty,
      aiCount: aiCount,
    });
    onClose();
  };

  const gameTag = (
    <>
      <span className="text-xs font-mono font-medium tracking-widest text-[#000000] uppercase flex items-center gap-1">
        <Layers size={14} strokeWidth={1.75} />
        <span>RAKCHA UNO</span>
      </span>
      <span className="text-[10px] font-mono text-[#47A5FF] bg-[#F0F6FF] px-2 py-0.5 rounded-[6px] border border-[#D5E5F7] font-medium">
        {isEditMode
          ? isAr
            ? 'تعديل الإعدادات'
            : isFr
            ? 'Modifier la salle'
            : 'Edit Room'
          : selectedCategory === 'ai'
          ? isAr
            ? 'وضع الكمبيوتر'
            : isFr
            ? 'Mode Solo'
            : 'Solo Mode'
          : isAr
          ? 'وضع الأصدقاء'
          : 'Friends Mode'}
      </span>
    </>
  );

  return (
    <SetupModal
      isOpen={isOpen}
      onClose={onClose}
      title={isAr ? 'اختر طريقة اللعب والبدء' : isFr ? 'Mode de jeu & configuration' : 'Choose Mode & Start Playing'}
      gameTag={gameTag}
      errorMessage={error}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Mode Switcher Tabs (Friends vs Solo) — Hidden in Edit Mode */}
      {!isEditMode && (
        <div className="grid grid-cols-2 gap-2 p-1 rounded-[14px] bg-[#F4F8FC] border border-[#D5E5F7]">
          <button
            type="button"
            onClick={() => setSelectedCategory('friends')}
            className={`py-3 rounded-[11px] text-xs font-mono font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedCategory === 'friends'
                ? 'bg-[#F0F6FF] text-[#000000] shadow-xs border border-[#47A5FF]'
                : 'text-[#4C5055] hover:text-[#000000]'
            }`}
          >
            <Users size={15} strokeWidth={1.75} className={selectedCategory === 'friends' ? 'text-[#47A5FF]' : ''} />
            <span>{isAr ? 'الأصدقاء (أونلاين)' : isFr ? 'Amis (En ligne)' : 'Friends (Online)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('ai')}
            className={`py-3 rounded-[11px] text-xs font-mono font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedCategory === 'ai'
                ? 'bg-[#F0F6FF] text-[#000000] shadow-xs border border-[#47A5FF]'
                : 'text-[#4C5055] hover:text-[#000000]'
            }`}
          >
            <Gamepad2 size={15} strokeWidth={1.75} />
            <span>{isAr ? 'ضد الكمبيوتر' : isFr ? 'Solo (Hors ligne)' : 'Play Solo (CPU)'}</span>
          </button>
        </div>
      )}

      {/* CATEGORY 1: FRIENDS MULTIPLAYER SETUP */}
      {(selectedCategory === 'friends' || isEditMode) && (
        <div className="space-y-4">
          {/* Room Visibility */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-widest text-[#4C5055] uppercase font-medium">
              {isAr ? 'اختر ظهور الغرفة' : isFr ? 'Visibilité de la salle' : 'Choose Room Visibility'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Public */}
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`p-4 rounded-[16px] border text-start transition-all cursor-pointer ${
                  !isPrivate
                    ? 'border-[#47A5FF] bg-[#F0F6FF] text-[#000000] ring-1 ring-[#47A5FF]/50'
                    : 'border-[#D5E5F7] bg-[#F4F8FC] text-[#4C5055] hover:border-[#47A5FF]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Globe size={18} strokeWidth={1.75} className={!isPrivate ? 'text-[#47A5FF]' : 'text-[#4C5055]'} />
                    <span className="text-xs font-semibold font-mono uppercase">
                      {isAr ? 'غرفة عامة' : isFr ? 'Salle Publique' : 'Public Room'}
                    </span>
                  </div>
                  {!isPrivate && <span className="w-2.5 h-2.5 rounded-full bg-[#47A5FF]" />}
                </div>
                <p className="text-[11px] text-[#4C5055] leading-relaxed font-normal">
                  {isAr
                    ? 'تظهر في قائمة الغرف المباشرة لجميع اللاعبين'
                    : isFr
                    ? 'Apparaît dans le lobby public des salles en direct'
                    : 'Visible in Live Rooms discovery lobby for everyone'}
                </p>
              </button>

              {/* Private */}
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`p-4 rounded-[16px] border text-start transition-all cursor-pointer ${
                  isPrivate
                    ? 'border-[#47A5FF] bg-[#F0F6FF] text-[#000000] ring-1 ring-[#47A5FF]/50'
                    : 'border-[#D5E5F7] bg-[#F4F8FC] text-[#4C5055] hover:border-[#47A5FF]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Lock size={18} strokeWidth={1.75} className={isPrivate ? 'text-[#47A5FF]' : 'text-[#4C5055]'} />
                    <span className="text-xs font-semibold font-mono uppercase">
                      {isAr ? 'غرفة خاصة' : isFr ? 'Salle Privée' : 'Private Room'}
                    </span>
                  </div>
                  {isPrivate && <span className="w-2.5 h-2.5 rounded-full bg-[#47A5FF]" />}
                </div>
                <p className="text-[11px] text-[#4C5055] leading-relaxed font-normal">
                  {isAr
                    ? 'الدخول عبر رمز الغرفة فقط ومشاركة الرابط'
                    : isFr
                    ? 'Accès par code ou lien d\'invitation uniquement'
                    : 'Join via room code or invite link only'}
                </p>
              </button>
            </div>
          </div>

          {/* Maximum Players Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-widest text-[#4C5055] uppercase flex items-center justify-between font-medium">
              <span>{isAr ? 'عدد اللاعبين الأقصى' : isFr ? 'Nombre max de joueurs' : 'Max Players'}</span>
              <span className="text-[#000000] font-bold">{maxPlayers} {isAr ? 'لاعبين' : 'Players'}</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {UNO_MAX_PLAYER_OPTIONS.map((count, idx) => (
                <button
                  key={`uno-max-players-${count}-${idx}`}
                  type="button"
                  onClick={() => setMaxPlayers(count)}
                  className={`py-2.5 rounded-[11px] text-xs font-mono font-semibold transition-all cursor-pointer ${
                    maxPlayers === count
                      ? 'bg-[#47A5FF] hover:bg-[#328FE6] text-white shadow-xs'
                      : 'bg-[#F4F8FC] text-[#4C5055] hover:text-[#000000] border border-[#D5E5F7]'
                  }`}
                >
                  {count} {isAr ? 'لاعبين' : 'P'}
                </button>
              ))}
            </div>
          </div>

          {/* Entry Cost Selection */}
          {!isEditMode && (
            <EntryCostSelector
              selectedCost={entryCost}
              onSelectCost={setEntryCost}
              disabled={isSubmitting}
            />
          )}

          {/* Submit Friends Room */}
          <div className="pt-2">
            <PrimaryButton
              onClick={handleStartFriendsRoom}
              isLoading={isSubmitting}
              icon={<ArrowRight size={15} strokeWidth={1.75} />}
              iconPosition="right"
              size="lg"
            >
              {isEditMode
                ? isAr
                  ? 'حفظ إعدادات الغرفة'
                  : isFr
                  ? 'Enregistrer les paramètres'
                  : 'Save Room Parameters'
                : isAr
                ? 'إنشاء غرفة أونلاين'
                : isFr
                ? 'Créer la salle en ligne'
                : 'Create Online Friends Room'}
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* CATEGORY 2: OFFLINE SOLO MODE SETUP */}
      {selectedCategory === 'ai' && !isEditMode && (
        <div className="space-y-4">
          {/* Difficulty Level Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-widest text-[#4C5055] uppercase flex items-center gap-1.5 font-medium">
              <Sliders size={14} strokeWidth={1.75} className="text-[#4C5055]" />
              <span>{isAr ? 'مستوى الصعوبة' : isFr ? 'Niveau de difficulté' : 'Difficulty Level'}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* EASY */}
              <button
                type="button"
                onClick={() => setAiDifficulty('easy')}
                className={`p-2.5 rounded-[14px] border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                  aiDifficulty === 'easy'
                    ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                    : 'border-[#D5E5F7] bg-[#F4F8FC] text-[#4C5055] hover:border-[#47A5FF]'
                }`}
              >
                <span className="text-xs font-mono font-semibold uppercase">{isAr ? 'سهل' : isFr ? 'Facile' : 'Easy'}</span>
                <span className="text-[10px] text-[#4C5055]">{isAr ? 'مبتدئ' : 'Casual'}</span>
              </button>

              {/* MEDIUM */}
              <button
                type="button"
                onClick={() => setAiDifficulty('medium')}
                className={`p-2.5 rounded-[14px] border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                  aiDifficulty === 'medium'
                    ? 'border-[#47A5FF] bg-[#F0F6FF] text-[#000000]'
                    : 'border-[#D5E5F7] bg-[#F4F8FC] text-[#4C5055] hover:border-[#47A5FF]'
                }`}
              >
                <span className="text-xs font-mono font-semibold uppercase">{isAr ? 'متوسط' : isFr ? 'Moyen' : 'Medium'}</span>
                <span className="text-[10px] text-[#4C5055]">{isAr ? 'متوازن' : 'Balanced'}</span>
              </button>

              {/* HARD */}
              <button
                type="button"
                onClick={() => setAiDifficulty('hard')}
                className={`p-2.5 rounded-[14px] border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                  aiDifficulty === 'hard'
                    ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#D97706]'
                    : 'border-[#D5E5F7] bg-[#F4F8FC] text-[#4C5055] hover:border-[#47A5FF]'
                }`}
              >
                <span className="text-xs font-mono font-semibold uppercase">{isAr ? 'صعب' : isFr ? 'Difficile' : 'Hard'}</span>
                <span className="text-[10px] text-[#4C5055]">{isAr ? 'تكتيكي' : 'Tactical'}</span>
              </button>

              {/* EXPERT */}
              <button
                type="button"
                onClick={() => setAiDifficulty('expert')}
                className={`p-2.5 rounded-[14px] border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                  aiDifficulty === 'expert'
                    ? 'border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]'
                    : 'border-[#D5E5F7] bg-[#F4F8FC] text-[#4C5055] hover:border-[#47A5FF]'
                }`}
              >
                <span className="text-xs font-mono font-semibold uppercase">{isAr ? 'خبير' : isFr ? 'Expert' : 'Expert'}</span>
                <span className="text-[10px] text-[#4C5055]">{isAr ? 'متكيف' : 'Adaptive'}</span>
              </button>
            </div>
          </div>

          {/* Opponents Count */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-widest text-[#4C5055] uppercase flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <Users size={14} strokeWidth={1.75} className="text-[#4C5055]" />
                <span>{isAr ? 'عدد الخصوم' : isFr ? 'Nombre d\'adversaires' : 'Opponents Count'}</span>
              </span>
              <span className="text-[#000000] font-bold">
                {aiCount} {isAr ? 'خصوم' : 'Players'} ({aiCount + 1} {isAr ? 'في المجموع' : 'Total'})
              </span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {UNO_AI_COUNT_OPTIONS.map((count, idx) => (
                <button
                  key={`uno-ai-count-${count}-${idx}`}
                  type="button"
                  onClick={() => setAiCount(count)}
                  className={`py-3 rounded-[11px] text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    aiCount === count
                      ? 'bg-[#47A5FF] hover:bg-[#328FE6] text-white shadow-xs'
                      : 'bg-[#F4F8FC] text-[#4C5055] hover:text-[#000000] border border-[#D5E5F7]'
                  }`}
                >
                  <span>{count} {isAr ? 'خصم' : 'CPU'}</span>
                  <span className="text-[10px] opacity-80">({count + 1}P)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3 rounded-[16px] bg-[#F4F8FC] border border-[#D5E5F7] text-[11px] font-mono text-[#4C5055] flex items-center gap-2 font-normal">
            <span>
              {isAr
                ? 'وضع أوفلاين محلي 100% - لا يتطلب إنترنت أو إنشاء غرفة!'
                : '100% Offline mode - No internet or room creation needed!'}
            </span>
          </div>

          {/* Submit Solo Match */}
          <div className="pt-2">
            <PrimaryButton
              onClick={handleStartAiMatch}
              icon={<ArrowRight size={15} strokeWidth={1.75} />}
              iconPosition="right"
              size="lg"
            >
              {isAr ? 'بدء اللعب الفردي • START MATCH' : 'START MATCH NOW'}
            </PrimaryButton>
          </div>
        </div>
      )}
    </SetupModal>
  );
};
