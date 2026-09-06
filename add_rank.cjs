const fs = require('fs');
let content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

const en = `
    newRankUnlocked: 'NEW RANK UNLOCKED',
    rankReachedDesc: 'You\\'ve reached {rank}! Your incredible performance puts you among the elite players.',
    exclusiveAvatarBorder: 'Exclusive Avatar Border',
    priorityMatchmaking: 'Priority Matchmaking',
    specialRankBadge: 'Special Rank Badge',
    awesomeLetsPlay: 'Awesome, Let\\'s Play!',
`;
const fr = `
    newRankUnlocked: 'NOUVEAU RANG DÉBLOQUÉ',
    rankReachedDesc: 'Vous avez atteint le rang {rank} ! Votre performance incroyable vous place parmi l\\'élite.',
    exclusiveAvatarBorder: 'Bordure d\\'Avatar Exclusive',
    priorityMatchmaking: 'Matchmaking Prioritaire',
    specialRankBadge: 'Badge de Rang Spécial',
    awesomeLetsPlay: 'Génial, Jouons !',
`;
const ar = `
    newRankUnlocked: 'إنجاز جديد',
    rankReachedDesc: 'لقد وصلت إلى التصنيف {rank}! أداؤك المذهل يضعك بين أفضل اللاعبين.',
    exclusiveAvatarBorder: 'إطار صورة أفاتار حصري',
    priorityMatchmaking: 'أفضلية في ترتيب اللاعبين',
    specialRankBadge: 'شارة تصنيف خاصة',
    awesomeLetsPlay: 'متابعة اللعب',
`;

content = content.replace(/allGames: 'All Games',/, en + "\n    allGames: 'All Games',");
content = content.replace(/allGames: 'Tous les Jeux',/, fr + "\n    allGames: 'Tous les Jeux',");
content = content.replace(/allGames: 'جميع الألعاب',/, ar + "\n    allGames: 'جميع الألعاب',");

fs.writeFileSync('src/lib/i18n.ts', content);
