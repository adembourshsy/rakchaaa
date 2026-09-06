/**
 * Calculates proportional coin change for a player based on entryCost, number of players,
 * and player rank (1st place, 2nd place, 3rd place, last place).
 */
export function calculatePlayerCoinChange(
  myUid: string,
  winnerIds: string[] = [],
  loserIds: string[] = [],
  entryCost: number = 30,
  isDraw: boolean = false,
  rankedPlayerIds?: string[]
): number {
  if (isDraw || !entryCost || entryCost <= 0) return 0;

  // Determine full ordered player list
  const allPlayers = rankedPlayerIds && rankedPlayerIds.length >= 2
    ? rankedPlayerIds
    : Array.from(new Set([...winnerIds, ...loserIds]));

  const N = allPlayers.length;
  if (N <= 1) return 0;

  const playerIndex = allPlayers.indexOf(myUid);
  if (playerIndex === -1) {
    // If myUid is not in ranked list, fallback to standard winner/loser
    const isWinner = winnerIds.includes(myUid);
    const isLoser = loserIds.includes(myUid);
    if (isWinner) return Math.round(entryCost / Math.max(1, winnerIds.length));
    if (isLoser) return -Math.round((entryCost * Math.max(1, winnerIds.length)) / Math.max(1, loserIds.length));
    return 0;
  }

  const rank = playerIndex + 1; // 1-based rank (1st = 1, 2nd = 2, ...)
  const C = entryCost;

  if (N === 2) {
    // 1v1 match: 1st wins +C, 2nd loses -C
    return rank === 1 ? C : -C;
  }

  if (N === 3) {
    // 3-Player match: e.g., C = 30
    // 1st place: +20 (2/3 of C)
    // 2nd place: +5 (1/6 of C)
    // 3rd place (last): -25 (loses gains of 1st and 2nd)
    const gain1st = Math.round(C * (2 / 3));
    const gain2nd = Math.round(C * (1 / 6));
    if (rank === 1) return gain1st;
    if (rank === 2) return gain2nd;
    return -(gain1st + gain2nd);
  }

  if (N === 4) {
    // 4-Player match: e.g., C = 30
    // 1st place (lwel): +15 (50% of C)
    // 2nd place (thni): +5 (1/6 of C)
    // 3rd place (thleth): +5 (1/6 of C)
    // 4th place (last): -25 (loses gains of 1st, 2nd, 3rd)
    const gain1st = Math.round(C * 0.5);
    const gain2nd = Math.round(C * (1 / 6));
    const gain3rd = Math.round(C * (1 / 6));
    if (rank === 1) return gain1st;
    if (rank === 2) return gain2nd;
    if (rank === 3) return gain3rd;
    return -(gain1st + gain2nd + gain3rd);
  }

  // N > 4 Players:
  // 1st place gets 50% of C
  // 2nd through (N-1)th share 50% of C equally
  // Nth place (last) loses the total sum of all gains
  const gain1st = Math.round(C * 0.5);
  const midGain = Math.round((C * 0.5) / (N - 2));
  if (rank === 1) return gain1st;
  if (rank < N) return midGain;

  const totalGains = gain1st + midGain * (N - 2);
  return -totalGains;
}
