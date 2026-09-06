import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Car, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MecanqueSettings } from '../../types';
import { SetupModal, PrimaryButton, SecondaryButton } from '../ui';
import { EntryCostSelector } from '../ui/EntryCostSelector';

interface MecanqueSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
}

type SetupStep = 1 | 2 | 3;

export const MecanqueSetupModal: React.FC<MecanqueSetupModalProps> = ({
  isOpen,
  onClose,
  isEditMode = false,
}) => {
  const { setMecanqueSettings, mecanqueSettings, createRoom, updateRoomParameters, joinedRoom, language } = useApp();

  const isAr = language === 'ar';
  const existingSettings = joinedRoom?.mecanqueSettings || mecanqueSettings;

  const [currentStep, setCurrentStep] = useState<SetupStep>(1);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'expert'>(
    existingSettings?.difficulty || 'beginner'
  );
  const [selectedCarCount, setSelectedCarCount] = useState<number>(
    existingSettings?.carCount || 5
  );
  const [selectedThinkingTime, setSelectedThinkingTime] = useState<number>(
    existingSettings?.thinkingTime || 30
  );
  const [entryCost, setEntryCost] = useState<number>(joinedRoom?.entryCost ?? 30);

  // Lock and error state for single room creation request
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentStep(1);
    setIsCreating(false);
    setCreationError(null);
    isSubmittingRef.current = false;
    onClose();
  };

  const handleBack = () => {
    if (isCreating) return;
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as SetupStep);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as SetupStep);
    } else {
      handleFinishSetup();
    }
  };

  const handleFinishSetup = async () => {
    // Prevent duplicate room creation requests
    if (isSubmittingRef.current || isCreating) return;

    isSubmittingRef.current = true;
    setIsCreating(true);
    setCreationError(null);

    try {
      const settings: MecanqueSettings = {
        difficulty: selectedDifficulty,
        carCount: selectedCarCount,
        thinkingTime: selectedThinkingTime,
      };

      // 1. Save local state
      setMecanqueSettings(settings);

      if (isEditMode && joinedRoom) {
        await updateRoomParameters({
          isPrivate: true,
          mecanqueSettings: settings,
        });
      } else {
        // 2. Automatically Create New Mecanque Room (always private)
        const newRoom = await createRoom('mecanque', 20, true, 'friends', 'virtual', settings, entryCost);

        if (!newRoom || !newRoom.id) {
          throw new Error('Failed to create room. Please try again.');
        }
      }

      handleClose();
    } catch (err: any) {
      console.error('Mecanque room creation/update error:', err);
      setCreationError(err?.message || 'Failed to apply room settings. Please try again.');
      isSubmittingRef.current = false;
      setIsCreating(false);
    }
  };

  const gameTag = (
    <div className="flex items-center justify-between w-full">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#F0F6FF] border border-[#D5E5F7] text-[#47A5FF] text-[10px] font-mono font-medium uppercase tracking-wider">
        <Car size={14} strokeWidth={1.75} />
        <span>
          {isEditMode
            ? isAr
              ? 'تعديل أمور ميكانيك'
              : 'EDIT MECANQUE'
            : isAr
            ? 'إعداد أمور ميكانيك'
            : 'OMOUR MECANQUE SETUP'}
        </span>
      </div>
      <span className="text-[11px] font-mono font-medium text-[#4C5055] tracking-widest uppercase">
        {isAr ? `مرحلة ${currentStep} من 3` : `STEP ${currentStep} OF 3`}
      </span>
    </div>
  );

  return (
    <SetupModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        currentStep === 1
          ? isAr
            ? 'اختر مستوى الصعوبة'
            : 'Select Challenge Level'
          : currentStep === 2
          ? isAr
            ? 'كم سيارة في الجولة؟'
            : 'How many cars?'
          : isAr
          ? 'وقت التفكير في السؤال'
          : 'Thinking Time per Clue'
      }
      subtitle={
        currentStep === 1
          ? isAr
            ? 'يحدد نوع السيارات ودقة المواصفات المطلوبة.'
            : 'Adjusts car rarity, detail precision, and engine sound subtleties.'
          : currentStep === 2
          ? isAr
            ? 'اختر إجمالي السيارات المراد تخمينها في الجولة.'
            : 'Choose the total number of cars to guess per round.'
          : undefined
      }
      gameTag={gameTag}
      progressBar={{ currentStep, totalSteps: 3 }}
      errorMessage={creationError}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* STEP CONTENT SWITCHER */}
      <AnimatePresence mode="wait">
        {/* STEP 1: PLAYER LEVEL */}
        {currentStep === 1 && (
          <motion.div
            key="step-1-level"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="space-y-2.5">
              {[
                {
                  id: 'beginner',
                  title: isAr ? 'سائق مبتدئ' : 'Beginner Driver',
                  desc: isAr ? 'سيارات شهيرة ومألوفة يوميًا في تونس' : 'Common daily cars, recognizable emblems and obvious sound hints',
                  badge: 'EASY',
                  color: 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]',
                },
                {
                  id: 'intermediate',
                  title: isAr ? 'ميكانيكي محترف' : 'Enthusiast Mechanic',
                  desc: isAr ? 'تنوع في الماركات، محركات توربو وسيارات أداء' : 'Popular European & Asian models, turbos, hot hatches, and trims',
                  badge: 'MEDIUM',
                  color: 'border-[#47A5FF]/40 bg-[#F0F6FF] text-[#47A5FF]',
                },
                {
                  id: 'expert',
                  title: isAr ? 'خبير سيارات وسوبركار' : 'Automotive Master',
                  desc: isAr ? 'سيارات كلاسيكية ونادرة وخارقة للمحترفين' : 'Exotics, limited editions, classic legends and tricky spec clues',
                  badge: 'EXPERT',
                  color: 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]',
                },
              ].map((level, idx) => {
                const isSelected = selectedDifficulty === level.id;
                return (
                  <button
                    key={`m-diff-${level.id}-${idx}`}
                    type="button"
                    onClick={() => setSelectedDifficulty(level.id as any)}
                    className={`w-full p-4 rounded-[16px] border text-start transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0F6FF] border-[#47A5FF] shadow-xs'
                        : 'bg-[#F4F8FC] border-[#D5E5F7] hover:border-[#47A5FF]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-[#000000]">{level.title}</h4>
                        <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-[6px] border ${level.color}`}>
                          {level.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#4C5055] leading-relaxed">{level.desc}</p>
                    </div>

                    <div className="shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#47A5FF] border-[#47A5FF] text-white'
                            : 'border-[#D5E5F7] text-transparent'
                        }`}
                      >
                        <Check size={14} strokeWidth={2.5} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <PrimaryButton
                onClick={handleNext}
                icon={<ArrowRight size={16} strokeWidth={1.75} />}
                iconPosition="right"
                size="lg"
              >
                {isAr ? 'التالي: عدد السيارات' : 'NEXT: NUMBER OF CARS'}
              </PrimaryButton>
            </div>
          </motion.div>
        )}

        {/* STEP 2: NUMBER OF CARS */}
        {currentStep === 2 && (
          <motion.div
            key="step-2-cars"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { count: 5, label: isAr ? '5 سيارات' : '5 Cars', tag: isAr ? 'جولة سريعة (~5د)' : 'Quick Sprint (~5m)' },
                { count: 10, label: isAr ? '10 سيارات' : '10 Cars', tag: isAr ? 'جولة قياسية (~10د)' : 'Standard (~10m)' },
                { count: 15, label: isAr ? '15 سيارة' : '15 Cars', tag: isAr ? 'سباق كامل (~15د)' : 'Full Match (~15m)' },
                { count: 20, label: isAr ? '20 سيارة' : '20 Cars', tag: isAr ? 'ماراثون تحدي (~20د)' : 'Endurance (~20m)' },
              ].map((item, idx) => {
                const isSelected = selectedCarCount === item.count;
                return (
                  <button
                    key={`m-car-count-${item.count}-${idx}`}
                    type="button"
                    onClick={() => setSelectedCarCount(item.count)}
                    className={`p-4 rounded-[16px] border text-start transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0F6FF] border-[#47A5FF] shadow-xs'
                        : 'bg-[#F4F8FC] border-[#D5E5F7] hover:border-[#47A5FF]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono font-bold text-[#000000]">{item.count}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#47A5FF] border-[#47A5FF] text-white'
                            : 'border-[#D5E5F7] text-transparent'
                        }`}
                      >
                        <Check size={12} strokeWidth={2.5} />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-[#000000]">{item.label}</h4>
                      <span className="text-[10px] font-mono text-[#4C5055] block mt-0.5">{item.tag}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <SecondaryButton
                fullWidth={false}
                className="flex-1"
                onClick={handleBack}
              >
                {isAr ? 'رجوع' : 'BACK'}
              </SecondaryButton>
              <PrimaryButton
                fullWidth={false}
                className="flex-[2]"
                onClick={handleNext}
                icon={<ArrowRight size={16} strokeWidth={1.75} />}
                iconPosition="right"
              >
                {isAr ? 'التالي: وقت التفكير' : 'NEXT: THINKING TIME'}
              </PrimaryButton>
            </div>
          </motion.div>
        )}

        {/* STEP 3: THINKING TIME */}
        {currentStep === 3 && (
          <motion.div
            key="step-3-timer"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Time Limits */}
            <div className="space-y-2">
              {[
                { sec: 15, label: isAr ? '15 ثانية' : '15 Seconds', desc: isAr ? 'سرعة فائقة وردود فورية' : 'Blitz speed, instant reflexes' },
                { sec: 30, label: isAr ? '30 ثانية' : '30 Seconds', desc: isAr ? 'متوازن وممتع للجميع' : 'Balanced duration for sound & specs' },
                { sec: 45, label: isAr ? '45 ثانية' : '45 Seconds', desc: isAr ? 'وقت كافٍ للنقاش والتفكير' : 'Relaxed mode with ample debate time' },
                { sec: 60, label: isAr ? '60 ثانية' : '60 Seconds', desc: isAr ? 'مريح للمبتدئين' : 'Casual mode for beginners' },
              ].map((timeItem, idx) => {
                const isSelected = selectedThinkingTime === timeItem.sec;
                return (
                  <button
                    key={`m-time-${timeItem.sec}-${idx}`}
                    type="button"
                    onClick={() => setSelectedThinkingTime(timeItem.sec)}
                    className={`w-full p-3.5 rounded-[16px] border text-start transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0F6FF] border-[#47A5FF] shadow-xs'
                        : 'bg-[#F4F8FC] border-[#D5E5F7] hover:border-[#47A5FF]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold text-[#000000]">{timeItem.label}</h4>
                      <p className="text-xs text-[#4C5055]">{timeItem.desc}</p>
                    </div>

                    <div className="shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#47A5FF] border-[#47A5FF] text-white'
                            : 'border-[#D5E5F7] text-transparent'
                        }`}
                      >
                        <Check size={12} strokeWidth={2.5} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!isEditMode && (
              <EntryCostSelector
                selectedCost={entryCost}
                onSelectCost={setEntryCost}
                disabled={isCreating}
              />
            )}

            <div className="flex gap-3 pt-2">
              <SecondaryButton
                fullWidth={false}
                className="flex-1"
                onClick={handleBack}
                disabled={isCreating}
              >
                {isAr ? 'رجوع' : 'BACK'}
              </SecondaryButton>
              <PrimaryButton
                fullWidth={false}
                className="flex-[2]"
                onClick={handleFinishSetup}
                isLoading={isCreating}
                loadingText={isAr ? 'جاري الحفظ...' : 'SAVING...'}
                icon={<ArrowRight size={16} strokeWidth={1.75} />}
                iconPosition="right"
              >
                {isEditMode ? (isAr ? 'حفظ الإعدادات' : 'SAVE PARAMETERS') : (isAr ? 'إنشاء الغرفة' : 'CREATE ROOM')}
              </PrimaryButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SetupModal>
  );
};
