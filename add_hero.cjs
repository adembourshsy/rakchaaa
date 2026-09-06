const fs = require('fs');
let content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

const heroEn = `
    authenticCardGames: 'AUTHENTIC TUNISIAN CARD GAMES',
    heroTagline: 'Rakcha brings the spirit of the Tunisian Qahwa to your phone. Play intense Belote, fast-paced Uno, and more with your friends in real-time. Pure social competition.',
    liveStreaks: 'LIVE STREAKS',
    multiplayer: 'MULTIPLAYER',
`;

const heroFr = `
    authenticCardGames: 'JEUX DE CARTES TUNISIENS',
    heroTagline: 'Rakcha apporte l\\'esprit de la Qahwa tunisienne sur votre téléphone. Jouez à la Belote intense, au Uno rapide et plus encore avec vos amis en temps réel.',
    liveStreaks: 'SÉRIES EN DIRECT',
    multiplayer: 'MULTIJOUEUR',
`;

const heroAr = `
    authenticCardGames: 'ألعاب الورق التونسية',
    heroTagline: 'ركشة تجيب جو القهوة التونسية لتليفونك. العب بيلوت، أونو، وأكثر مع صحابك في الوقت الفعلي. منافسة حية وتفاعل حقيقي!',
    liveStreaks: 'تصنيف مباشر',
    multiplayer: 'لعب جماعي',
`;

content = content.replace(/allGames: 'All Games',/, heroEn + "\n    allGames: 'All Games',");
content = content.replace(/allGames: 'Tous les Jeux',/, heroFr + "\n    allGames: 'Tous les Jeux',");
content = content.replace(/allGames: 'جميع الألعاب',/, heroAr + "\n    allGames: 'جميع الألعاب',");

fs.writeFileSync('src/lib/i18n.ts', content);
