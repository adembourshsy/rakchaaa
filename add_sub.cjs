const fs = require('fs');

let content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

const subEn = `
    gameSub_mecanque: 'Automotive Trivia',
    gameSub_uno_game: 'Strategic Card Game',
    gameSub_intrus: 'Social Deduction',
    gameSub_mind_rally: 'Truth or Dare',
    gameSub_chess: 'Classic Board Game',
    gameSub_belote: 'Belote',
    gameSub_coming_soon: 'Coming Soon',
`;

const subFr = `
    gameSub_mecanque: 'Trivia Automobile',
    gameSub_uno_game: 'Jeu de cartes stratégique',
    gameSub_intrus: 'Déduction Sociale',
    gameSub_mind_rally: 'Action ou Vérité',
    gameSub_chess: 'Jeu de société classique',
    gameSub_belote: 'Belote',
    gameSub_coming_soon: 'Bientôt disponible',
`;

const subAr = `
    gameSub_mecanque: 'تحدي السيارات',
    gameSub_uno_game: 'لعبة أوراق استراتيجية',
    gameSub_intrus: 'لعبة الخداع الاجتماعي',
    gameSub_mind_rally: 'صراحة أو تحدي',
    gameSub_chess: 'لعبة لوحية كلاسيكية',
    gameSub_belote: 'بيلوت',
    gameSub_coming_soon: 'قيد التحضير',
`;

content = content.replace(/gameDesc_mecanque: 'Identify/, subEn + "\n    gameDesc_mecanque: 'Identify");
content = content.replace(/gameDesc_mecanque: 'Identifiez/, subFr + "\n    gameDesc_mecanque: 'Identifiez");
content = content.replace(/gameDesc_mecanque: 'تعرف/, subAr + "\n    gameDesc_mecanque: 'تعرف");

fs.writeFileSync('src/lib/i18n.ts', content);
