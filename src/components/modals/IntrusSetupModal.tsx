import React, { useState, useRef } from 'react';
import { HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SetupModal, PrimaryButton } from '../ui';
import { EntryCostSelector } from '../ui/EntryCostSelector';

interface IntrusSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntrusSetupModal: React.FC<IntrusSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createRoom, language, userProfile } = useApp();
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const [entryCost, setEntryCost] = useState<number>(30);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsCreating(false);
    isSubmittingRef.current = false;
    setError(null);
    onClose();
  };

  const handleStartGame = async () => {
    if (isSubmittingRef.current || isCreating) return;

    // Coins balance validation check
    const userCoins = userProfile?.coins ?? 0;
    if (entryCost > 0 && userCoins < entryCost) {
      setError(
        isAr
          ? 'رصيدك غير كافٍ للاشتراك بهذه القيمة. اختر قيمة أقل أو اجمع المزيد من الكوينز.'
          : isFr
          ? 'Solde de pièces insuffisant pour cette mise. Choisissez une mise inférieure.'
          : 'Insufficient coins for this entry fee. Please choose a lower amount.'
      );
      return;
    }

    isSubmittingRef.current = true;
    setIsCreating(true);
    setError(null);

    try {
      // Direct room creation for L'Intrus with chosen entry cost
      const newRoom = await createRoom(
        'intrus',
        20,
        true,
        'friends',
        'virtual',
        undefined,
        entryCost
      );

      if (!newRoom || !newRoom.id) {
        throw new Error('Failed to create room. Please try again.');
      }

      handleClose();
    } catch (err: any) {
      console.error("Error launching L'Intrus:", err);
      setError(
        err?.message ||
          (isAr
            ? 'حدث خطأ أثناء بدء اللعبة. يرجى المحاولة مرة أخرى.'
            : isFr
            ? 'Erreur lors du lancement de la partie. Veuillez réessayer.'
            : 'Error starting game. Please try again.')
      );
    } finally {
      setIsCreating(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <SetupModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isAr ? "لعبة المندَس • L'Intrus" : "L'Intrus"}
      subtitle={
        isAr
          ? 'اختر قيمة الرهان وابدأ اللعب مباشرة مع أصدقائك!'
          : isFr
          ? 'Choisis la mise d\'entrée et lance la partie immédiatement !'
          : 'Select the entry coins and jump straight into the game!'
      }
      gameTag={
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#9C27B0]/15 text-[#9C27B0] text-[11px] font-mono font-bold tracking-wider uppercase border border-[#9C27B0]/25">
          <HelpCircle size={14} strokeWidth={2} />
          <span>{isAr ? 'كشف المندَس' : "L'Intrus"}</span>
        </div>
      }
      errorMessage={error}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="space-y-5">
        {/* Entry Cost Stake Selector */}
        <div className="p-4 rounded-[14px] bg-[#F4F8FC] border border-[#D5E5F7] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#000000] flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-[#10B981]" />
              <span>
                {isAr ? 'قيمة الرهان / تكلفة الدخول' : isFr ? 'Mise d\'entrée' : 'Entry Stake'}
              </span>
            </span>
            <span className="text-[11px] font-mono text-[#4C5055]">
              {isAr ? '3 إلى 20 لاعبين' : '3 - 20 Players'}
            </span>
          </div>

          <EntryCostSelector
            selectedCost={entryCost}
            onSelectCost={setEntryCost}
            disabled={isCreating}
          />
        </div>

        {/* Start Game Action */}
        <div className="pt-2">
          <PrimaryButton
            id="start-intrus-direct-btn"
            onClick={handleStartGame}
            disabled={isCreating}
            icon={<ArrowRight size={16} strokeWidth={2} />}
            iconPosition="right"
            size="lg"
          >
            {isCreating
              ? isAr
                ? 'جاري فتح الغرفة...'
                : 'Starting Match...'
              : isAr
              ? 'ابدأ اللعب الآن • START PLAYING'
              : isFr
              ? 'LANCER LA PARTIE'
              : 'START PLAYING NOW'}
          </PrimaryButton>
        </div>
      </div>
    </SetupModal>
  );
};
