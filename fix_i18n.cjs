const fs = require('fs');

let content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

// Insert them back inside en, fr, ar objects
content = content.replace(/appTitle: 'RAKCHA GAME',/, "appTitle: 'RAKCHA GAME',\n    allGames: 'All Games',\n    gameRules: 'Game Rules',\n    invalidCode: 'Invalid room code. Please try again.',\n    enterCodePlaceholder: 'e.g. QSXP89',");

// Find the second `appTitle: 'RAKCHA GAME',` (fr)
let count = 0;
content = content.replace(/appTitle: 'RAKCHA GAME',/g, match => {
  count++;
  if (count === 2) {
    return "appTitle: 'RAKCHA GAME',\n    allGames: 'Tous les Jeux',\n    gameRules: 'Règles du jeu',\n    invalidCode: 'Code de salon invalide. Veuillez réessayer.',\n    enterCodePlaceholder: 'ex. QSXP89',";
  }
  if (count === 3) {
    return "appTitle: 'RAKCHA GAME',\n    allGames: 'جميع الألعاب',\n    gameRules: 'قوانين اللعبة',\n    invalidCode: 'رمز الغرفة غير صالح. يرجى المحاولة مرة أخرى.',\n    enterCodePlaceholder: 'مثال: QSXP89',";
  }
  return match;
});

fs.writeFileSync('src/lib/i18n.ts', content);
