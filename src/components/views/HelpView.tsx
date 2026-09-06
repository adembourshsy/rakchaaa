import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  HelpCircle,
  BookOpen,
  Shield,
  Zap,
  AlertCircle,
  UserX,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  UploadCloud,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Section, SimpleModal } from '../ui';
import { reportUser, submitSupportMessage } from '../../firebase/moderationService';

export const HelpView: React.FC = () => {
  const { setActiveView, friends, t } = useApp();

  // Accordion Expand State for FAQs
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Active Support Tab / Modal States
  const [isReportProblemOpen, setIsReportProblemOpen] = useState(false);
  const [isReportPlayerOpen, setIsReportPlayerOpen] = useState(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);

  // Report Problem Form State
  const [problemCategory, setProblemCategory] = useState<'bug' | 'gameplay' | 'sound' | 'content'>('bug');
  const [problemDescription, setProblemDescription] = useState('');
  const [problemSubmitted, setProblemSubmitted] = useState(false);
  const [problemSubmitting, setProblemSubmitting] = useState(false);
  const [problemError, setProblemError] = useState<string | null>(null);

  // Report Player Form State
  const [selectedPlayerToReport, setSelectedPlayerToReport] = useState<string>(friends[0]?.id || '');
  const [playerReportReason, setPlayerReportReason] = useState<'inappropriate_name' | 'harassment' | 'cheating' | 'other'>('harassment');
  const [playerReportDetails, setPlayerReportDetails] = useState('');
  const [playerReportSubmitted, setPlayerReportSubmitted] = useState(false);
  const [playerReportSubmitting, setPlayerReportSubmitting] = useState(false);
  const [playerReportError, setPlayerReportError] = useState<string | null>(null);

  // Direct Contact Support Message State
  const [contactMessage, setContactMessage] = useState('');
  const [contactSentSuccess, setContactSentSuccess] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // FAQs Data List
  const faqList = [
    { q: t('faqQuestion1'), a: t('faqAnswer1') },
    { q: t('faqQuestion2'), a: t('faqAnswer2') },
    { q: t('faqQuestion3'), a: t('faqAnswer3') },
    { q: t('faqQuestion4'), a: t('faqAnswer4') },
    { q: t('faqQuestion5'), a: t('faqAnswer5') },
  ];

  // Submit Handlers — all three write to real Firestore collections (see
  // src/firebase/moderationService.ts) and are reviewable via the Firestore
  // console / an admin view, same pattern as the existing `cards` moderation.
  const handleSubmitProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemDescription.trim() || problemSubmitting) return;

    setProblemError(null);
    setProblemSubmitting(true);
    try {
      await submitSupportMessage({ type: 'problem', category: problemCategory, message: problemDescription });
      setProblemSubmitted(true);
      setTimeout(() => {
        setProblemSubmitted(false);
        setProblemDescription('');
        setIsReportProblemOpen(false);
      }, 1800);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.warn('[rakcha] Failed to submit problem report:', err);
      setProblemError(err?.message || t('submitFailedTryAgain'));
    } finally {
      setProblemSubmitting(false);
    }
  };

  const handleSubmitPlayerReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerToReport || playerReportSubmitting) return;

    const target = friends.find((f) => f.id === selectedPlayerToReport);
    setPlayerReportError(null);
    setPlayerReportSubmitting(true);
    try {
      await reportUser({
        reportedUserId: selectedPlayerToReport,
        reportedUsername: target?.name || target?.username || 'Player',
        reason: playerReportReason,
        messageText: playerReportDetails,
      });
      setPlayerReportSubmitted(true);
      setTimeout(() => {
        setPlayerReportSubmitted(false);
        setPlayerReportDetails('');
        setIsReportPlayerOpen(false);
      }, 1800);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.warn('[rakcha] Failed to submit player report:', err);
      setPlayerReportError(err?.message || t('submitFailedTryAgain'));
    } finally {
      setPlayerReportSubmitting(false);
    }
  };

  const handleSendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim() || contactSubmitting) return;

    setContactError(null);
    setContactSubmitting(true);
    try {
      await submitSupportMessage({ type: 'contact', message: contactMessage });
      setContactSentSuccess(true);
      setTimeout(() => {
        setContactSentSuccess(false);
        setContactMessage('');
        setIsContactSupportOpen(false);
      }, 1800);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.warn('[rakcha] Failed to send support message:', err);
      setContactError(err?.message || t('submitFailedTryAgain'));
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-28 pt-2 text-left"
    >
      {/* Navigation Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#989277]/30 dark:border-[#B8B5A5]/20">
        <button
          onClick={() => setActiveView('settings')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#040403]/5 dark:bg-[#F8F7E8]/5 text-xs font-mono text-[#989277] dark:text-[#B8B5A5] hover:text-[#040403] dark:hover:text-[#F8F7E8] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>{t('settings')}</span>
        </button>

        <div className="flex items-center gap-2">
          <HelpCircle size={14} className="text-[#FF8600]" />
          <h2 className="text-sm font-mono font-bold tracking-wider text-[#040403] dark:text-[#F8F7E8] uppercase">
            {t('help')}
          </h2>
        </div>

        <div className="w-16" />
      </div>

      {/* 1. HOW TO PLAY QUICK GUIDE */}
      <Section
        icon={<BookOpen size={14} />}
        title={t('helpGuideTitle')}
        trailing={<span className="text-[10px] font-mono text-[#989277]">3 {t('mins').toUpperCase()}</span>}
      >
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-3 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20 text-center space-y-1">
            <div className="w-6 h-6 rounded-full bg-[#FF8600] text-white font-mono text-xs font-bold flex items-center justify-center mx-auto">
              1
            </div>
            <p className="text-[11px] font-mono font-bold text-[#040403] dark:text-[#F8F7E8]">
              {t('helpGuideStep1Title')}
            </p>
            <p className="text-[9px] text-[#989277] leading-tight">
              {t('helpGuideStep1Desc')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20 text-center space-y-1">
            <div className="w-6 h-6 rounded-full bg-[#FF8600] text-white font-mono text-xs font-bold flex items-center justify-center mx-auto">
              2
            </div>
            <p className="text-[11px] font-mono font-bold text-[#040403] dark:text-[#F8F7E8]">
              {t('helpGuideStep2Title')}
            </p>
            <p className="text-[9px] text-[#989277] leading-tight">
              {t('helpGuideStep2Desc')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20 text-center space-y-1">
            <div className="w-6 h-6 rounded-full bg-[#FF8600] text-white font-mono text-xs font-bold flex items-center justify-center mx-auto">
              3
            </div>
            <p className="text-[11px] font-mono font-bold text-[#040403] dark:text-[#F8F7E8]">
              {t('helpGuideStep3Title')}
            </p>
            <p className="text-[9px] text-[#989277] leading-tight">
              {t('helpGuideStep3Desc')}
            </p>
          </div>
        </div>
      </Section>

      {/* 2. GAME RULES BREAKDOWN */}
      <Section icon={<Zap size={14} />} title={t('helpRulesTitle')}>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-red-500 font-mono text-[10px] font-bold uppercase">
              <Zap size={12} />
              <span>{t('helpCardAction')}</span>
            </div>
            <p className="text-[10px] text-[#040403]/80 dark:text-[#F8F7E8]/80">
              {t('helpCardActionDesc')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold uppercase">
              <HelpCircle size={12} />
              <span>{t('helpCardTruth')}</span>
            </div>
            <p className="text-[10px] text-[#040403]/80 dark:text-[#F8F7E8]/80">
              {t('helpCardTruthDesc')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase">
              <Shield size={12} />
              <span>{t('helpCardShield')}</span>
            </div>
            <p className="text-[10px] text-[#040403]/80 dark:text-[#F8F7E8]/80">
              {t('helpCardShieldDesc')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold uppercase">
              <span>{t('helpCardSpecial')}</span>
            </div>
            <p className="text-[10px] text-[#040403]/80 dark:text-[#F8F7E8]/80">
              {t('helpCardSpecialDesc')}
            </p>
          </div>
        </div>
      </Section>

      {/* 3. FAQ ACCORDION */}
      <Section icon={<HelpCircle size={14} />} title={t('faqTitle')}>
        <div className="divide-y divide-[#989277]/20 dark:divide-[#B8B5A5]/10">
          {faqList.map((faq, idx) => {
            const isExpanded = expandedFaqIndex === idx;
            return (
              <div key={`faq-${idx}`} className="py-3 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-2 group"
                >
                  <span className="text-xs font-mono font-medium text-[#040403] dark:text-[#F8F7E8] group-hover:text-[#FF8600] transition-colors">
                    {faq.q}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-[#FF8600] shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-[#989277] shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      key={`faq-answer-${idx}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 text-xs text-[#989277] dark:text-[#B8B5A5] leading-relaxed bg-[#040403]/5 dark:bg-[#F8F7E8]/5 p-3 rounded-xl border border-[#989277]/15"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 4. SUPPORT ACTIONS (REPORT & CONTACT) */}
      <Section icon={<MessageSquare size={14} />} title={t('supportActionsTitle')}>
        <div className="space-y-2">
          {/* Report a Problem */}
          <button
            onClick={() => setIsReportProblemOpen(true)}
            className="w-full p-3.5 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20 flex items-center justify-between hover:border-[#FF8600] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-[#FF8600]" />
              <div className="text-left">
                <span className="text-xs font-mono font-bold text-[#040403] dark:text-[#F8F7E8] block group-hover:text-[#FF8600]">
                  {t('reportProblemTitle')}
                </span>
                <span className="text-[10px] text-[#989277] block">
                  {t('reportProblemSubtitle')}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-[#FF8600] font-bold">{t('open')} →</span>
          </button>

          {/* Report a Player */}
          <button
            onClick={() => setIsReportPlayerOpen(true)}
            className="w-full p-3.5 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20 flex items-center justify-between hover:border-[#FF8600] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <UserX size={16} className="text-red-500" />
              <div className="text-left">
                <span className="text-xs font-mono font-bold text-[#040403] dark:text-[#F8F7E8] block group-hover:text-red-500">
                  {t('reportPlayerTitle')}
                </span>
                <span className="text-[10px] text-[#989277] block">
                  {t('reportPlayerSubtitle')}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-red-500 font-bold">{t('open')} →</span>
          </button>

          {/* Contact Support */}
          <button
            onClick={() => setIsContactSupportOpen(true)}
            className="w-full p-3.5 rounded-xl bg-[#FF8600]/10 border border-[#FF8600]/30 flex items-center justify-between hover:bg-[#FF8600]/15 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare size={16} className="text-[#FF8600]" />
              <div className="text-left">
                <span className="text-xs font-mono font-bold text-[#FF8600] block">
                  {t('contactSupportTitle')}
                </span>
                <span className="text-[10px] text-[#989277] block">
                  {t('contactSupportSubtitle')}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-[#FF8600] font-bold">{t('visit').toUpperCase()} →</span>
          </button>
        </div>
      </Section>

      {/* ================= REPORT A PROBLEM MODAL ================= */}
      <SimpleModal isOpen={isReportProblemOpen}>
        <div className="flex items-center justify-between pb-3 border-b border-[#989277]/20 dark:border-[#B8B5A5]/15">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[#FF8600]" />
            <h3 className="text-sm font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
              {t('reportProblemTitle')}
            </h3>
          </div>
          <button onClick={() => setIsReportProblemOpen(false)} className="p-1 text-[#989277]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmitProblem} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-[#989277] uppercase">{t('category')}</label>
            <select
              value={problemCategory}
              onChange={(e) => setProblemCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 text-xs font-mono text-[#040403] dark:text-[#F8F7E8]"
            >
              <option value="bug">{t('categoryBug')}</option>
              <option value="gameplay">{t('categoryGameplay')}</option>
              <option value="sound">{t('categorySound')}</option>
              <option value="content">{t('categoryContent')}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-[#989277] uppercase">{t('problemDescription')}</label>
            <textarea
              rows={3}
              required
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder={t('problemDescriptionPlaceholder')}
              className="w-full px-3 py-2 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 text-xs font-mono text-[#040403] dark:text-[#F8F7E8]"
            />
          </div>

          <div className="p-3 rounded-xl border border-dashed border-[#989277]/30 flex items-center justify-center gap-2 text-xs font-mono text-[#989277]">
            <UploadCloud size={16} />
            <span>{t('addScreenshot')}</span>
          </div>

          {problemSubmitted ? (
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold text-center">
              {t('problemSubmittedSuccess')}
            </div>
          ) : (
            <>
              {problemError && (
                <div className="p-2.5 rounded-xl bg-red-500/15 text-red-500 text-[11px] font-mono text-center">
                  {problemError}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportProblemOpen(false)}
                  className="flex-1 py-2.5 rounded-full border text-xs font-mono uppercase"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={problemSubmitting}
                  className="flex-1 py-2.5 rounded-full bg-[#FF8600] text-white text-xs font-mono font-bold uppercase disabled:opacity-50"
                >
                  {t('confirm')}
                </button>
              </div>
            </>
          )}
        </form>
      </SimpleModal>

      {/* ================= REPORT A PLAYER MODAL ================= */}
      <SimpleModal isOpen={isReportPlayerOpen}>
        <div className="flex items-center justify-between pb-3 border-b border-[#989277]/20 dark:border-[#B8B5A5]/15">
          <div className="flex items-center gap-2">
            <UserX size={16} className="text-red-500" />
            <h3 className="text-sm font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
              {t('reportPlayerTitle')}
            </h3>
          </div>
          <button onClick={() => setIsReportPlayerOpen(false)} className="p-1 text-[#989277]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmitPlayerReport} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-[#989277] uppercase">{t('playerToReport')}</label>
            <select
              value={selectedPlayerToReport}
              onChange={(e) => setSelectedPlayerToReport(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 text-xs font-mono text-[#040403] dark:text-[#F8F7E8]"
            >
              <option value="" disabled>{t('choosePlayer')}</option>
              {friends.map((f, idx) => (
                <option key={`help-friend-${f.id}-${idx}`} value={f.id}>{f.name} ({f.username})</option>
              ))}
              {friends.length === 0 && (
                <option value="system" disabled>No players available</option>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-[#989277] uppercase">{t('reportReason')}</label>
            <select
              value={playerReportReason}
              onChange={(e) => setPlayerReportReason(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 text-xs font-mono text-[#040403] dark:text-[#F8F7E8]"
            >
              <option value="harassment">{t('reasonHarassment')}</option>
              <option value="inappropriate_name">{t('reasonInappropriate')}</option>
              <option value="cheating">{t('reasonCheating')}</option>
              <option value="other">{t('reasonOther')}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-[#989277] uppercase">{t('reportDetails')}</label>
            <textarea
              rows={2}
              value={playerReportDetails}
              onChange={(e) => setPlayerReportDetails(e.target.value)}
              placeholder={t('reportDetailsPlaceholder')}
              className="w-full px-3 py-2 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 text-xs font-mono text-[#040403] dark:text-[#F8F7E8]"
            />
          </div>

          {playerReportSubmitted ? (
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold text-center">
              {t('reportSubmittedSuccess')}
            </div>
          ) : (
            <>
              {playerReportError && (
                <div className="p-2.5 rounded-xl bg-red-500/15 text-red-500 text-[11px] font-mono text-center">
                  {playerReportError}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportPlayerOpen(false)}
                  className="flex-1 py-2.5 rounded-full border text-xs font-mono uppercase"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!selectedPlayerToReport || playerReportSubmitting}
                  className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-xs font-mono font-bold uppercase disabled:opacity-50"
                >
                  {t('confirm')}
                </button>
              </div>
            </>
          )}
        </form>
      </SimpleModal>

      {/* ================= CONTACT SUPPORT MODAL ================= */}
      <SimpleModal isOpen={isContactSupportOpen}>
        <div className="flex items-center justify-between pb-3 border-b border-[#989277]/20 dark:border-[#B8B5A5]/15">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-[#FF8600]" />
            <h3 className="text-sm font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
              {t('contactSupportTitle')}
            </h3>
          </div>
          <button onClick={() => setIsContactSupportOpen(false)} className="p-1 text-[#989277]">
            <X size={16} />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#FF8600]/10 border border-[#FF8600]/20 flex items-center justify-between text-xs font-mono text-[#FF8600]">
          <div className="flex items-center gap-1.5">
            <Clock size={13} />
            <span>{t('estimatedResponse')}</span>
          </div>
          <span className="font-bold uppercase">{t('onlineSupport')}</span>
        </div>

        <form onSubmit={handleSendContact} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-[#989277] uppercase">{t('yourMessage')}</label>
            <textarea
              rows={4}
              required
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder={t('messagePlaceholder')}
              className="w-full px-3 py-2 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 text-xs font-mono text-[#040403] dark:text-[#F8F7E8]"
            />
          </div>

          <p className="text-[10px] text-[#989277]">
            Email: <strong className="font-mono text-[#040403] dark:text-[#F8F7E8]">support@rakchagame.com</strong>
          </p>

          {contactSentSuccess ? (
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold text-center">
              {t('messageSentSuccess')}
            </div>
          ) : (
            <>
              {contactError && (
                <div className="p-2.5 rounded-xl bg-red-500/15 text-red-500 text-[11px] font-mono text-center">
                  {contactError}
                </div>
              )}
              <button
                type="submit"
                disabled={contactSubmitting}
                className="w-full py-3 rounded-full bg-[#FF8600] text-white text-xs font-mono font-bold uppercase flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={14} />
                <span>{t('confirm')}</span>
              </button>
            </>
          )}
        </form>
      </SimpleModal>
    </motion.div>
  );
};
