import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Gamepad2,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
  Heart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { submitFeedback } from '../../firebase/feedbackService';

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'suggestion' | 'bug' | 'general' | 'game_idea';

const FEEDBACK_OPTIONS: {
  id: FeedbackType;
  title: string;
  arTitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgLight: string;
  bgDark: string;
}[] = [
  {
    id: 'suggestion',
    title: 'Suggestion',
    arTitle: 'اقتراح تحسين',
    icon: Lightbulb,
    color: 'text-amber-500',
    bgLight: 'bg-amber-500/10 border-amber-500/30',
    bgDark: 'dark:bg-amber-500/15 dark:border-amber-500/30',
  },
  {
    id: 'game_idea',
    title: 'Game Idea',
    arTitle: 'فكرة لعبة جديدة',
    icon: Gamepad2,
    color: 'text-[#47A5FF]',
    bgLight: 'bg-[#47A5FF]/10 border-[#47A5FF]/30',
    bgDark: 'dark:bg-[#47A5FF]/15 dark:border-[#47A5FF]/30',
  },
  {
    id: 'bug',
    title: 'Bug Report',
    arTitle: 'مشكلة تقنية',
    icon: Bug,
    color: 'text-rose-500',
    bgLight: 'bg-rose-500/10 border-rose-500/30',
    bgDark: 'dark:bg-rose-500/15 dark:border-rose-500/30',
  },
  {
    id: 'general',
    title: 'General Feedback',
    arTitle: 'رأي عام',
    icon: MessageSquare,
    color: 'text-emerald-500',
    bgLight: 'bg-emerald-500/10 border-emerald-500/30',
    bgDark: 'dark:bg-emerald-500/15 dark:border-emerald-500/30',
  },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, user } = useApp();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitStatus('idle');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await submitFeedback({
        userId: userProfile.id || user?.uid || 'guest',
        userName: userProfile.name || 'Player',
        userEmail: contactEmail.trim() || user?.email || '',
        category: feedbackType,
        categoryTitle: FEEDBACK_OPTIONS.find((o) => o.id === feedbackType)?.title || feedbackType,
        message: trimmed,
        recipientEmail: 'bougerraa179@gmail.com',
      });

      if (result.success) {
        setSubmitStatus('success');
        setMessage('');
        setTimeout(() => {
          setSubmitStatus('idle');
          onClose();
        }, 2200);
      } else {
        setSubmitStatus('error');
        setErrorMessage('Failed to send feedback. Please try again.');
      }
    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMessage(err.message || 'Connection error. Please check your internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        key="feedback-modal-backdrop"
        id="feedback-modal-backdrop"
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <motion.div
          id="feedback-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-0 sm:my-auto"
        >
          {/* Header */}
          <div className="relative px-5 py-4 sm:px-6 sm:pt-6 sm:pb-4 border-b border-[#D5E5F7]/80 dark:border-[#334155] flex items-center justify-between shrink-0 bg-white/95 dark:bg-[#1E293B]/95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#47A5FF] to-[#0067FF] flex items-center justify-center text-white shadow-md shadow-[#47A5FF]/25 shrink-0">
                <MessageSquare size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#000000] dark:text-[#F8FAFC] flex items-center gap-1.5">
                  Give Feedback
                </h3>
                <p className="text-xs text-[#4C5055] dark:text-[#94A3B8]">
                  شاركنا رأيك أو اقترح لعبة جديدة
                </p>
              </div>
            </div>

            <button
              id="close-feedback-modal-btn"
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 touch-pan-y">
            {submitStatus === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 size={36} strokeWidth={2.2} />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  شكراً لمشاركتك! / Thank you!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed">
                  تم إرسال ملاحظتك مباشرة إلى بريد إدارة اللعبة (
                  <span className="font-mono text-[#0067FF] font-semibold">bougerraa179@gmail.com</span>
                  ). نقدر مساهمتك في تطوير اللعبة!
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Feedback Type Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    نوع الملاحظة / Feedback Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FEEDBACK_OPTIONS.map((opt, idx) => {
                      const Icon = opt.icon;
                      const isSelected = feedbackType === opt.id;
                      return (
                        <button
                          key={`feedback-opt-${opt.id}-${idx}`}
                          type="button"
                          id={`feedback-type-${opt.id}`}
                          onClick={() => setFeedbackType(opt.id)}
                          className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? `${opt.bgLight} ${opt.bgDark} ring-2 ring-[#47A5FF]/40 font-bold shadow-xs`
                              : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-white dark:bg-slate-800 shadow-xs' : 'bg-slate-200/60 dark:bg-slate-700/50'
                            }`}
                          >
                            <Icon size={15} className={opt.color} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-tight truncate">{opt.title}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {opt.arTitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      رسالتك / Your Message <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {message.length}/1000
                    </span>
                  </div>
                  <textarea
                    id="feedback-message-textarea"
                    required
                    rows={4}
                    maxLength={1000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      feedbackType === 'game_idea'
                        ? 'مثال: نتمنى إضافة لعبة شكبة (Chkobba) أو دومينو مع أصدقائي...'
                        : feedbackType === 'bug'
                        ? 'يرجى وصف المشكلة والخطوات التي حدثت فيها...'
                        : 'اكتب رأيك أو اقتراحك هنا بكل حرية...'
                    }
                    className="w-full p-3.5 text-base sm:text-sm rounded-2xl border border-[#D5E5F7] dark:border-[#334155] bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#47A5FF] transition-all resize-none touch-auto select-text"
                  />
                </div>

                {/* Optional User Contact Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    بريدك للرد (اختياري) / Contact Email (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      id="feedback-contact-email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-base sm:text-xs rounded-xl border border-[#D5E5F7] dark:border-[#334155] bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#47A5FF] transition-all touch-auto select-text"
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {submitStatus === 'error' && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Direct Owner Delivery Note */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Heart size={13} className="text-rose-500 fill-rose-500" />
                    يصل مباشرة إلى صاحب اللعبة
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    bougerraa179@gmail.com
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    id="cancel-feedback-btn"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel / إلغاء
                  </button>

                  <button
                    type="submit"
                    id="submit-feedback-btn"
                    disabled={isSubmitting || !message.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#47A5FF] to-[#0067FF] hover:from-[#3b93e8] hover:to-[#0058db] active:scale-95 text-white font-bold text-xs shadow-md shadow-[#47A5FF]/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Feedback</span>
                        <Send size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
