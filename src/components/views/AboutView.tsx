import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Info,
  FileText,
  Shield,
  Heart,
  Globe,
  ExternalLink,
  X,
  Check,
  Flame,
  Code,
  Music,
  Palette,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Section, SimpleModal } from '../ui';
import { LammaHubLogoIcon } from '../brand/LammaHubLogo';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export const AboutView: React.FC = () => {
  const { setActiveView, t } = useApp();

  // Modals state
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const { copied: copiedLink, copy: copyLink } = useCopyToClipboard();
  const handleCopyLink = () => copyLink('https://rakchagame.com');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-28 pt-2 text-left"
    >
      {/* Navigation Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
        <button
          onClick={() => setActiveView('settings')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 text-xs font-mono text-[#0F172A] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{t('settings')}</span>
        </button>

        <div className="flex items-center gap-2">
          <Info size={14} className="text-[#FF5436]" />
          <h2 className="text-sm font-mono font-bold tracking-wider text-[#0F172A] dark:text-[#F8FAFC] uppercase">
            {t('aboutTheApp')}
          </h2>
        </div>

        <div className="w-16" />
      </div>

      {/* BRANDING LOGO & HERO DESCRIPTION CARD */}
      <section className="rounded-3xl bg-gradient-to-b from-[#FF5436]/15 to-[#FFB800]/10 border border-[#FF5436]/30 p-6 text-center space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-2 right-2 opacity-10 pointer-events-none text-[#FF5436]">
          <Flame size={120} />
        </div>

        {/* Logo emblem */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] inline-flex items-center justify-center mx-auto shadow-lg ring-4 ring-[#47A5FF]/20">
          <LammaHubLogoIcon sizePx={52} />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-mono font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            RAKCHA GAME
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#FF5436] text-white text-[10px] font-mono font-bold tracking-wider uppercase">
            <span>VERSION 2.4.0</span>
            <span>•</span>
            <span>BUILD 8420</span>
          </div>
        </div>

        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
          {t('aboutAppDescription')}
        </p>
      </section>

      {/* 1. APP INFORMATION */}
      <Section icon={<Info size={14} />} title={t('accountInfo').toUpperCase()}>
        <div className="divide-y divide-black/10 dark:divide-white/10">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC]">{t('officialVersion')}</span>
            <span className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">2.4.0 (Build 8420)</span>
          </div>

          <button
            onClick={() => setIsWhatsNewOpen(true)}
            className="w-full py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-[#FF5436]">
                {t('whatsNew')}
              </span>
            </div>
            <span className="text-xs font-mono text-[#FF5436] font-bold">{t('open')} →</span>
          </button>
        </div>
      </Section>

      {/* 2. LEGAL & MENTIONS LÉGALES */}
      <Section icon={<FileText size={14} />} title={t('legalDocumentation')}>
        <div className="divide-y divide-black/10 dark:divide-white/10">
          <button
            onClick={() => setIsTermsOpen(true)}
            className="w-full py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#64748B] dark:text-[#94A3B8]" />
              <span className="text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-[#FF5436]">
                {t('termsOfService')}
              </span>
            </div>
            <span className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">{t('open')} →</span>
          </button>

          <button
            onClick={() => setIsPrivacyOpen(true)}
            className="w-full py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-[#64748B] dark:text-[#94A3B8]" />
              <span className="text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-[#FF5436]">
                {t('privacyPolicyStr')}
              </span>
            </div>
            <span className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">{t('open')} →</span>
          </button>
        </div>
      </Section>

      {/* 3. CREDITS & CREATORS */}
      <Section icon={<Heart size={14} />} title={t('creditsTeam')}>
        <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
          <p className="text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] leading-relaxed">
            {t('creditsTeamDesc')}
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-black/10 dark:border-white/10 text-center">
            <div className="space-y-0.5">
              <Palette size={14} className="mx-auto text-[#FF5436]" />
              <p className="text-[10px] font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">UI / UX</p>
              <p className="text-[9px] text-[#64748B] dark:text-[#94A3B8]">Opal Design</p>
            </div>

            <div className="space-y-0.5">
              <Code size={14} className="mx-auto text-[#FF5436]" />
              <p className="text-[10px] font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">Code</p>
              <p className="text-[9px] text-[#64748B] dark:text-[#94A3B8]">React & Motion</p>
            </div>

            <div className="space-y-0.5">
              <Music size={14} className="mx-auto text-[#FF5436]" />
              <p className="text-[10px] font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">Audio</p>
              <p className="text-[9px] text-[#64748B] dark:text-[#94A3B8]">Synth Wave</p>
            </div>
          </div>
        </div>
      </Section>

      {/* 4. OFFICIAL LINKS & SOCIAL MEDIA */}
      <Section icon={<Globe size={14} />} title={t('officialLinksSocial')}>
        <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-[#FF5436]" />
            <span className="text-xs font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">rakchagame.com</span>
          </div>

          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-[#FF5436] text-white text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check size={12} />
                <span>{t('copied')} !</span>
              </>
            ) : (
              <>
                <ExternalLink size={12} />
                <span>{t('visit')}</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1">
          {['Instagram', 'TikTok', 'Twitter', 'Discord'].map((platform, idx) => (
            <div
              key={`about-soc-${platform}-${idx}`}
              className="py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-center text-[10px] font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] hover:border-[#FF5436] cursor-pointer transition-colors"
            >
              {platform}
            </div>
          ))}
        </div>
      </Section>

      {/* ================= WHAT'S NEW RELEASE NOTES MODAL ================= */}
      <SimpleModal isOpen={isWhatsNewOpen}>
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] uppercase">
              {t('whatsNewTitle')}
            </h3>
          </div>
          <button onClick={() => setIsWhatsNewOpen(false)} className="p-1 text-[#64748B] dark:text-[#94A3B8] cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          <div className="space-y-1">
            <p className="text-xs font-mono font-bold text-[#FF5436] dark:text-[#FFB800]">{t('news1Title')}</p>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              {t('news1Desc')}
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/10 dark:border-white/10">
            <p className="text-xs font-mono font-bold text-[#FF5436] dark:text-[#FFB800]">{t('news2Title')}</p>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              {t('news2Desc')}
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/10 dark:border-white/10">
            <p className="text-xs font-mono font-bold text-[#FF5436] dark:text-[#FFB800]">{t('news3Title')}</p>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              {t('news3Desc')}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsWhatsNewOpen(false)}
          className="w-full py-2.5 rounded-full bg-[#FF5436] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-sm cursor-pointer"
        >
          {t('understood')}
        </button>
      </SimpleModal>

      {/* ================= TERMS OF SERVICE MODAL ================= */}
      <SimpleModal isOpen={isTermsOpen}>
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
          <h3 className="text-sm font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] uppercase">
            {t('termsOfService')}
          </h3>
          <button onClick={() => setIsTermsOpen(false)} className="p-1 text-[#64748B] dark:text-[#94A3B8] cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-h-72 overflow-y-auto pr-1">
          <p>{t('termsText1')}</p>
          <p>{t('termsText2')}</p>
          <p>{t('termsText3')}</p>
        </div>

        <button
          onClick={() => setIsTermsOpen(false)}
          className="w-full py-2.5 rounded-full bg-[#0F172A] dark:bg-[#FF5436] text-white text-xs font-mono font-bold uppercase cursor-pointer"
        >
          {t('closeBtn')}
        </button>
      </SimpleModal>

      {/* ================= PRIVACY POLICY MODAL ================= */}
      <SimpleModal isOpen={isPrivacyOpen}>
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
          <h3 className="text-sm font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] uppercase">
            {t('privacyPolicyStr')}
          </h3>
          <button onClick={() => setIsPrivacyOpen(false)} className="p-1 text-[#64748B] dark:text-[#94A3B8] cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-h-72 overflow-y-auto pr-1">
          <p>{t('privacyText1')}</p>
          <p>{t('privacyText2')}</p>
          <p>{t('privacyText3')}</p>
        </div>

        <button
          onClick={() => setIsPrivacyOpen(false)}
          className="w-full py-2.5 rounded-full bg-[#0F172A] dark:bg-[#FF5436] text-white text-xs font-mono font-bold uppercase cursor-pointer"
        >
          {t('closeBtn')}
        </button>
      </SimpleModal>
    </motion.div>
  );
};
