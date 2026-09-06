import React from 'react';
import { Language, MecanqueSettings } from '../types';
import { Zap, HelpCircle, Shield, Award, Gauge, Volume2, Timer, Trophy, LucideProps } from 'lucide-react';

export interface RuleCardData {
  category: string;
  title: string;
  icon: React.ComponentType<LucideProps>;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  description: string;
  example: string;
  exampleLabel: string;
}

// Game explanations/instructions must ALWAYS be displayed in Arabic across all games
export const getIntrusRules = (_lang?: Language): RuleCardData[] => {
  return [
    {
      category: 'المواضيع السرية',
      title: 'الموضوع السري المشترك',
      icon: Award,
      badgeBg: 'bg-purple-500/15 border border-purple-500/30',
      badgeText: 'text-purple-500 dark:text-purple-400',
      borderColor: 'border-2 border-purple-500/80',
      description: 'في بداية كل جولة، يتحصل جميع اللاعبين العاديين على نفس الموضوع السري (مثال: 🏖️ الشاطئ).',
      example: '🏖️ الشاطئ — حافظ على سرية الموضوع وتحدث بحذر!',
      exampleLabel: 'مثال للموضوع:'
    },
    {
      category: 'دور الدخيل',
      title: 'الدخيل (L\'Intrus)',
      icon: Shield,
      badgeBg: 'bg-red-500/15 border border-red-500/30',
      badgeText: 'text-red-500 dark:text-red-400',
      borderColor: 'border-2 border-red-500/80',
      description: 'لاعب واحد فقط يكون الدخيل بدون معرفة الموضوع السري! يجب عليه التمويه واستنتاج الموضوع من أسئلة الآخرين.',
      example: 'أنت الدخيل! استمع باهتمام لكل سؤال وحاول تخمين الموضوع.',
      exampleLabel: 'تنبيه الدخيل:'
    },
    {
      category: 'الأسئلة والابتكار',
      title: 'ابتكار الأسئلة الحرة',
      icon: HelpCircle,
      badgeBg: 'bg-amber-500/15 border border-amber-500/30',
      badgeText: 'text-amber-500 dark:text-amber-400',
      borderColor: 'border-2 border-amber-500/80',
      description: 'لا توجد أسئلة جاهزة! في دورك، أنت من تبتكر وتكتب السؤال الموجه للاعب المستهدف لكشف الدخيل.',
      example: 'شنوّة أكثر حاجة تعملها غادي؟',
      exampleLabel: 'مثال لسؤال مبتكر:'
    },
    {
      category: 'التصويت والإقصاء',
      title: 'التصويت والفرصة الأخيرة',
      icon: Trophy,
      badgeBg: 'bg-emerald-500/15 border border-emerald-500/30',
      badgeText: 'text-emerald-500 dark:text-emerald-400',
      borderColor: 'border-2 border-emerald-500/80',
      description: 'بعد جولتين، يصوت الجميع لكشف الدخيل. إذا تم إقصاء الدخيل، يحصل على فرصة أخيرة واحدة لتخمين الموضوع السري والربح!',
      example: 'إذا كشف الدخيل الموضوع ينقذ نفسه ويربح الجولة!',
      exampleLabel: 'شرط الفوز:'
    }
  ];
};

export const getActionVeriteRules = (_lang?: Language): RuleCardData[] => {
  return [
    {
      category: 'بطاقة حمراء',
      title: 'تحدي / أكشن',
      icon: Zap,
      badgeBg: 'bg-red-500/15 border border-red-500/30',
      badgeText: 'text-red-500 dark:text-red-400',
      borderColor: 'border-2 border-red-500/80',
      description: 'تحتوي على أحكام، تحديات جسدية، أو أداء جماعي مضحك يجب عليك تنفيذه مباشرة أمام أصدقائك.',
      example: 'قم برقصة النصر لمدة 15 ثانية أو اسمح للاعبين بإرسال تحدي عبر رسالة نصية.',
      exampleLabel: 'مثال على التحدي:'
    },
    {
      category: 'بطاقة صفراء',
      title: 'صراحة / سؤال',
      icon: HelpCircle,
      badgeBg: 'bg-amber-400/15 border border-amber-400/30',
      badgeText: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-2 border-amber-400/80',
      description: 'تحتوي على أسئلة عميقة أو محرجة يجب أن تجيب عليها بصدق للحفاظ على نقاطك وتجنب العقوبة.',
      example: 'اكشف عن أغرب عملية بحث قمت بها مؤخراً على الإنترنت.',
      exampleLabel: 'مثال على السؤال:'
    },
    {
      category: 'بطاقة خضراء',
      title: 'درع / تخطي',
      icon: Shield,
      badgeBg: 'bg-emerald-500/15 border border-emerald-500/30',
      badgeText: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-2 border-emerald-500/80',
      description: 'تمنحك وسيلة دفاعية قابلة للاستخدام. يمكنك حفظ الدروع لتخطي الأسئلة أو التحديات الصعبة لاحقاً.',
      example: 'درع × 1 يسمح لك بتخطي أي تحدٍ بنجاح.',
      exampleLabel: 'مثال على الدرع:'
    },
    {
      category: 'بطاقة خاصة',
      title: 'خيارات وتأثيرات خاصة',
      icon: Award,
      badgeBg: 'bg-purple-500/15 border border-purple-500/30',
      badgeText: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-2 border-purple-500/80',
      description: 'بطاقات نادرة متعددة الألوان تقدم خيارات تكتيكية تغير مجرى اللعب وتزيد الإثارة والتنافس.',
      example: 'اختر بين "إزالة لاعب" أو "طرح سؤال محرج".',
      exampleLabel: 'مثال على الخيار:'
    }
  ];
};

export const getMecanqueRules = (
  _lang?: Language,
  settings?: MecanqueSettings
): RuleCardData[] => {
  const diffLabel = settings?.difficulty === 'expert' 
    ? 'خبير 🔴'
    : settings?.difficulty === 'intermediate'
    ? 'متوسط 🟡'
    : 'مبتدئ 🟢';

  const carCount = settings?.carCount || 5;
  const thinkingTime = settings?.thinkingTime || 30;

  return [
    {
      category: 'إعدادات المباراة',
      title: `المستوى: ${diffLabel} • ${carCount} سيارات • ${thinkingTime}ث`,
      icon: Gauge,
      badgeBg: 'bg-amber-500/15 border border-amber-500/30',
      badgeText: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-2 border-amber-500/80',
      description: `تمت إعداد هذه الغرفة لمستوى ${diffLabel}. ستتنافسون على اكتشاف ${carCount} سيارات غامضة، مع منح ${thinkingTime} ثانية لكل مرحلة تلميح.`,
      example: `المستوى: ${diffLabel} | عدد السيارات: ${carCount} | مؤقت التلميح: ${thinkingTime} ثانية`,
      exampleLabel: 'تفاصيل الغرفة الحالية:'
    },
    {
      category: 'طريقة اللعب',
      title: '5 مراحل تلميح تدريجية',
      icon: Volume2,
      badgeBg: 'bg-blue-500/15 border border-blue-500/30',
      badgeText: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-2 border-blue-500/80',
      description: 'تكشف كل جولة التلميحات تدريجياً: 1. صوت المحرك الحقيقي ← 2. بلد التصنيع ← 3. سنة الإنتاج ← 4. مواصفات المحرك والأحصنة ← 5. صورة مشوشة.',
      example: 'استمع بدقة لصوت المحرك في المرحلة الأولى لتخمين السيارة فوراً!',
      exampleLabel: 'نصيحة التلميح:'
    },
    {
      category: 'الأدوار والتخمين',
      title: 'إجابات مباشرة وسريعة',
      icon: Timer,
      badgeBg: 'bg-purple-500/15 border border-purple-500/30',
      badgeText: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-2 border-purple-500/80',
      description: 'يكتب جميع اللاعبين إجاباتهم في وقت واحد عبر المحادثة المباشرة خلال وقت التفكير المتاح. تتوفر مرونة إملائية لأسماء الشركات والموديلات.',
      example: 'يقبل النظام الإجابات بأسماء الماركات أو الموديلات مثل "Golf 7" أو "Volkswagen" أو "VW Golf".',
      exampleLabel: 'مثال الإجابة المقبولة:'
    },
    {
      category: 'النقاط والفوز',
      title: 'السرعة تمنح نقاطاً أكثر',
      icon: Trophy,
      badgeBg: 'bg-emerald-500/15 border border-emerald-500/30',
      badgeText: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-2 border-emerald-500/80',
      description: 'التخمين الصحيح في المرحلة الأولى يمنح 5 نقاط. المرحلة الثانية = 4 نقاط، الثالثة = 3 نقاط، الرابعة = نقطتان، والخامسة = نقطة واحدة. اللاعب الأعلـى نقاطاً يربح المباراة!',
      example: 'خمن 3 سيارات من المرحلة الأولى لتحصل على 15 نقطة وتتوج ببطولة الغرفة!',
      exampleLabel: 'حساب النقاط:'
    }
  ];
};


export interface UnoRulesData {
  title: string;
  playersLabel: string;
  playersValue: string;
  startingCardsLabel: string;
  startingCardsValue: string;
  howToPlayLabel: string;
  howToPlayDesc: string;
  howToPlayItems: string[];
  actionCardsLabel: string;
  actionCards: { name: string; desc: string; colorClass?: string }[];
  drawingLabel: string;
  drawingDesc: string;
  unoLabel: string;
  unoDesc: string;
  counterUnoLabel: string;
  counterUnoDesc: string;
  winningLabel: string;
  winningDesc: string;
}

// Game explanations/instructions must ALWAYS be displayed in Arabic
export const getUnoRules = (_lang?: Language): UnoRulesData => {
  return {
    title: 'قواعد لعبة UNO',
    playersLabel: 'اللاعبون',
    playersValue: '2–4 لاعبين',
    startingCardsLabel: 'بطاقات البداية',
    startingCardsValue: '7 بطاقات لكل لاعب',
    howToPlayLabel: 'طريقة اللعب',
    howToPlayDesc: 'العب بطاقة تطابق البطاقة الحالية المكشوفة من حيث:',
    howToPlayItems: ['اللون (أحمر، أصفر، أخضر، أزرق)', 'الرقم (0–9)', 'الرمز أو الأكشن الخاص'],
    actionCardsLabel: 'بطاقات الأكشن الخاصة',
    actionCards: [
      { name: 'تخطي (Skip)', desc: 'يتخطى دور اللاعب التالي في الترتيب.', colorClass: 'text-amber-500' },
      { name: 'عكس الاتجاه (Reverse)', desc: 'يعكس اتجاه اللعب بالكامل.', colorClass: 'text-blue-500' },
      { name: '+2 (سحب بطاقتين)', desc: 'يجبر اللاعب التالي على سحب بطاقتين وفقدان دوره.', colorClass: 'text-red-500' },
      { name: 'تغيير اللون (Wild)', desc: 'يسمح لك باختيار اللون التالي المناسب للعب.', colorClass: 'text-purple-500' },
      { name: 'سحب 4 وتغيير اللون (+4)', desc: 'يغير اللون ويجبر اللاعب التالي على سحب 4 بطاقات وفقدان دوره.', colorClass: 'text-amber-500' }
    ],
    drawingLabel: 'سحب البطاقات',
    drawingDesc: 'إذا لم تكن لديك بطاقة قابلة للعب، يجب عليك سحب بطاقة واحدة من كومة السحب.',
    unoLabel: '🎙️ قول UNO',
    unoDesc: 'عندما تتبقى لديك بطاقة واحدة فقط، يجب عليك الإعلان وقول UNO أو الضغط على زر UNO خلال ثانية واحدة كحد أقصى لتفادي العقوبة.',
    counterUnoLabel: '⚡ كاونتر UNO (اعتراض)',
    counterUnoDesc: 'إذا نسي أي لاعب قول UNO قبل نهاية الوقت، يمكن للاعب آخر الضغط على زر كاونتر UNO للإمساك به ومعاقبته بسحب بطاقتين فوراً.',
    winningLabel: '🏆 الفوز بالجولة',
    winningDesc: 'أول لاعب ينجح في التخلص من جميع بطاقاته هو الفائز بالجولة.'
  };
};
