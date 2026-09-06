import { UnoCard } from '../components/game/UnoGameView';
import {
  AiLogicLearningService,
  UnoPlayerProfile as LearningUnoProfile,
  UnoColor,
  AiDifficulty,
} from './aiLogicLearningService';

export type UnoPlayerProfile = LearningUnoProfile;

export class UnoAiBrain {
  public static getProfile(): UnoPlayerProfile {
    return AiLogicLearningService.getUnoProfile();
  }

  public static saveProfile(profile: Partial<UnoPlayerProfile>): void {
    AiLogicLearningService.saveUnoProfile(profile);
  }

  public static recordHumanMove(card: UnoCard, remainingCardsCount: number): void {
    AiLogicLearningService.recordUnoPlayerPlay(card, remainingCardsCount);
  }

  public static recordGameOutcome(humanWon: boolean, remainingCards: number = 0, difficulty: AiDifficulty = 'medium', durationSeconds: number = 180): void {
    AiLogicLearningService.recordUnoMatchOutcome(humanWon, remainingCards, difficulty, durationSeconds);
  }

  public static recordWildChoice(color: UnoColor): void {
    AiLogicLearningService.recordUnoWildColorChoice(color);
  }

  public static getHumanFavoredColor(): UnoColor {
    const profile = this.getProfile();
    const entries = Object.entries(profile.colorPlayCounts) as [UnoColor, number][];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0]?.[1] > 0 ? entries[0][0] : 'red';
  }
}

export interface UnoAiDecisionContext {
  aiPlayer: { id: string; name: string; cards: UnoCard[] };
  allPlayers: Array<{ id: string; name: string; cards: UnoCard[]; declaredUno?: boolean }>;
  playableCards: UnoCard[];
  activeColor: 'red' | 'yellow' | 'green' | 'blue';
  topDiscard: UnoCard | null;
  playDirection: 'clockwise' | 'counterclockwise';
  difficulty: AiDifficulty;
}

/**
 * Intelligent decision maker with dynamic heuristic evaluation, card counting, and player profiling
 */
export function selectBestUnoPlay(ctx: UnoAiDecisionContext): {
  chosenCard: UnoCard;
  chosenWildColor: 'red' | 'yellow' | 'green' | 'blue';
  strategyReason: string;
} {
  const { aiPlayer, allPlayers, playableCards, activeColor, playDirection, difficulty } = ctx;
  const humanFavored = UnoAiBrain.getHumanFavoredColor();
  const profile = UnoAiBrain.getProfile();
  const dynamicParams = profile.dynamicStrategy;

  // Find next player in turn order
  const currentIdx = allPlayers.findIndex((p) => p.id === aiPlayer.id);
  const shift = playDirection === 'clockwise' ? 1 : -1;
  let nextIdx = (currentIdx + shift) % allPlayers.length;
  if (nextIdx < 0) nextIdx += allPlayers.length;
  const nextPlayer = allPlayers[nextIdx];
  const isNextPlayerHuman = nextPlayer && !nextPlayer.id.startsWith('bot-');
  const nextPlayerCardCount = nextPlayer ? nextPlayer.cards.length : 7;
  const isNextPlayerCriticalThreat = nextPlayerCardCount <= 2;

  // Count AI hand colors
  const handColorCounts: Record<'red' | 'yellow' | 'green' | 'blue', number> = {
    red: 0,
    yellow: 0,
    green: 0,
    blue: 0,
  };
  aiPlayer.cards.forEach((c) => {
    if (c.color !== 'wild') handColorCounts[c.color as 'red' | 'yellow' | 'green' | 'blue']++;
  });

  // Determine AI's optimal dominant color
  const sortedAiColors = (Object.entries(handColorCounts) as ['red' | 'yellow' | 'green' | 'blue', number][]).sort(
    (a, b) => b[1] - a[1]
  );
  let bestAiColor: 'red' | 'yellow' | 'green' | 'blue' = sortedAiColors[0]?.[0] || activeColor || 'red';

  // If hard/expert difficulty and next player is human/threat, avoid picking human's favored color
  if ((difficulty === 'hard' || difficulty === 'expert') && (isNextPlayerCriticalThreat || isNextPlayerHuman)) {
    if (bestAiColor === humanFavored && sortedAiColors[1] && sortedAiColors[1][1] >= 1) {
      bestAiColor = sortedAiColors[1][0];
    }
  }

  // --- EASY DIFFICULTY ---
  // Casual play: 40% random play, otherwise simple match
  if (difficulty === 'easy') {
    if (Math.random() < 0.4) {
      const randomCard = playableCards[Math.floor(Math.random() * playableCards.length)];
      return {
        chosenCard: randomCard,
        chosenWildColor: sortedAiColors[Math.floor(Math.random() * sortedAiColors.length)]?.[0] || 'red',
        strategyReason: 'Casual play',
      };
    }
    const nonWilds = playableCards.filter((c) => c.color !== 'wild');
    return {
      chosenCard: nonWilds.length > 0 ? nonWilds[0] : playableCards[0],
      chosenWildColor: bestAiColor,
      strategyReason: 'Simple match',
    };
  }

  // --- MEDIUM DIFFICULTY ---
  // Standard tactical play: responds to direct threats, prefers majority color
  if (difficulty === 'medium') {
    const actionCards = playableCards.filter(
      (c) => c.value === 'draw2' || c.value === 'skip' || c.value === 'reverse' || c.value === 'wild4'
    );

    if (isNextPlayerCriticalThreat && actionCards.length > 0) {
      return {
        chosenCard: actionCards[0],
        chosenWildColor: bestAiColor,
        strategyReason: 'Attacking threat player',
      };
    }

    // Prefer matching dominant hand color
    const bestMatching = playableCards.filter((c) => c.color === bestAiColor);
    if (bestMatching.length > 0) {
      return {
        chosenCard: bestMatching[0],
        chosenWildColor: bestAiColor,
        strategyReason: 'Building dominant hand color',
      };
    }

    const nonWilds = playableCards.filter((c) => c.color !== 'wild');
    const picked = nonWilds.length > 0 ? nonWilds[0] : playableCards[0];
    return {
      chosenCard: picked,
      chosenWildColor: bestAiColor,
      strategyReason: 'Standard balanced move',
    };
  }

  // --- HARD & EXPERT DIFFICULTY (ADAPTIVE GRANDMASTER) ---
  let bestScore = -99999;
  let bestCard = playableCards[0];
  let strategy = 'Tactical optimal';

  const isExpert = difficulty === 'expert';
  const defenseMult = (dynamicParams.defensiveUrgencyWeight || 1.0) * (isExpert ? 1.4 : 1.0);
  const denialMult = (dynamicParams.colorDenialWeight || 1.0) * (isExpert ? 1.5 : 1.0);
  const reverseMult = (dynamicParams.reverseRedirectionFactor || 1.0) * (isExpert ? 1.3 : 1.0);
  const targetMult = isNextPlayerHuman ? ((dynamicParams.targetedAttackPriority || 1.0) * (isExpert ? 1.35 : 1.0)) : 1.0;

  playableCards.forEach((card) => {
    let score = 0;

    // 1. Next player defense / threat denial
    if (isNextPlayerCriticalThreat) {
      if (card.value === 'wild4') score += Math.round(220 * defenseMult * targetMult);
      if (card.value === 'draw2') score += Math.round(180 * defenseMult * targetMult);
      if (card.value === 'skip') score += Math.round(160 * defenseMult * targetMult);
      if (card.value === 'reverse') {
        score += Math.round((allPlayers.length > 2 ? 140 : 90) * reverseMult);
      }
    } else {
      // If no immediate threat, smartly conserve wild cards
      if (card.value === 'wild4') {
        score += aiPlayer.cards.length <= 3 ? 110 : Math.round(-40 * dynamicParams.wildHoardingThreshold);
      }
      if (card.value === 'wild') {
        score += aiPlayer.cards.length <= 2 ? 80 : -15;
      }
      if (card.value === 'draw2' || card.value === 'skip' || card.value === 'reverse') {
        score += 45;
      }
    }

    // 2. Color hand strength synergy
    if (card.color !== 'wild') {
      const remainingOfThisColor = handColorCounts[card.color as 'red' | 'yellow' | 'green' | 'blue'] || 0;
      score += remainingOfThisColor * (isExpert ? 32 : 25);
    }

    // 3. Counter-human learning strategy: Avoid leading into human's favorite color
    if (card.color === humanFavored && (isNextPlayerCriticalThreat || isNextPlayerHuman)) {
      score -= Math.round(35 * denialMult); // Penalize playing into human's best color
    }

    // 4. Discard high point number cards first to minimize point penalty
    if (!isNaN(Number(card.value))) {
      score += Number(card.value) * (isExpert ? 3.5 : 2);
    }

    // 5. Ending chain (can AI finish in next turn?)
    if (aiPlayer.cards.length === 2 && card.color === bestAiColor) {
      score += 60;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
      if (isNextPlayerCriticalThreat && (card.value === 'wild4' || card.value === 'draw2' || card.value === 'skip')) {
        strategy = `Defensive block against ${nextPlayer?.name || 'opponent'}`;
      } else if (card.color === bestAiColor) {
        strategy = `Promoting majority color ${bestAiColor.toUpperCase()}`;
      }
    }
  });

  return {
    chosenCard: bestCard,
    chosenWildColor: bestAiColor,
    strategyReason: strategy,
  };
}
