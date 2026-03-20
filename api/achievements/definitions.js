// api/achievements/definitions.js
// Achievement definitions and lookup helper

export const ACHIEVEMENTS = [
  // --- Matches category ---
  { key: 'first_blood', name: 'First Blood', description: 'Win your first match', icon: '\u2694\uFE0F', category: 'matches' },
  { key: 'getting_started', name: 'Getting Started', description: 'Play 5 matches', icon: '\uD83C\uDFD3', category: 'matches' },
  { key: 'regular', name: 'Regular', description: 'Play 25 matches', icon: '\uD83C\uDFAF', category: 'matches' },
  { key: 'veteran', name: 'Veteran', description: 'Play 50 matches', icon: '\uD83C\uDFC5', category: 'matches' },
  { key: 'streak_3', name: 'On Fire', description: 'Win 3 matches in a row', icon: '\uD83D\uDD25', category: 'matches' },
  { key: 'streak_5', name: 'Unstoppable', description: 'Win 5 matches in a row', icon: '\uD83D\uDCAA', category: 'matches' },
  { key: 'streak_10', name: 'Legendary', description: 'Win 10 matches in a row', icon: '\uD83D\uDC51', category: 'matches' },
  { key: 'giant_killer', name: 'Giant Killer', description: 'Beat someone ranked 200+ ELO higher', icon: '\uD83D\uDDE1\uFE0F', category: 'matches' },
  { key: 'comeback_king', name: 'Comeback King', description: 'Win after being down 5+ points', icon: '\uD83E\uDDB8', category: 'matches' },
  { key: 'iron_wall', name: 'Iron Wall', description: 'Win 3 matches without opponent scoring 15+', icon: '\uD83D\uDEE1\uFE0F', category: 'matches' },

  // --- Betting category ---
  { key: 'first_bet', name: 'First Bet', description: 'Place your first prediction', icon: '\uD83C\uDFB2', category: 'betting' },
  { key: 'whale', name: 'Whale', description: 'Place a single bet of 100+ points', icon: '\uD83D\uDC0B', category: 'betting' },
  { key: 'diversified', name: 'Diversified', description: 'Hold positions in 5+ different markets', icon: '\uD83D\uDCCA', category: 'betting' },
  { key: 'oracle', name: 'Oracle', description: 'Profit on 3 resolved markets', icon: '\uD83D\uDD2E', category: 'betting' },
  { key: 'sharp', name: 'Sharp', description: 'Achieve 25%+ ROI on markets', icon: '\uD83E\uDDE0', category: 'betting' },

  // --- Social category ---
  { key: 'early_adopter', name: 'Early Adopter', description: 'One of the first 10 users to join', icon: '\uD83C\uDF1F', category: 'social' },
  { key: 'market_maker', name: 'Market Maker', description: 'Have your bets move a price by 10%+', icon: '\uD83D\uDCC8', category: 'social' },
];

export function getAchievementDef(key) {
  return ACHIEVEMENTS.find(a => a.key === key) || null;
}
