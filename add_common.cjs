const fs = require('fs');

let content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

const en = `
    entryFeeLabel: 'Entry Fee',
    balanceLabel: 'Balance: {coins}',
    freeLabel: 'Free',
    insufficientCoins: 'Insufficient coins balance for this entry cost!',
    getCoins: 'Get Coins',
`;

const fr = `
    entryFeeLabel: 'Frais d\\'entrée',
    balanceLabel: 'Solde : {coins}',
    freeLabel: 'Gratuit',
    insufficientCoins: 'Solde de coins insuffisant !',
    getCoins: 'Obtenir Coins',
`;

const ar = `
    entryFeeLabel: 'رسوم الدخول',
    balanceLabel: 'رصيدك: {coins}',
    freeLabel: 'مجاني',
    insufficientCoins: 'رصيدك الحالي غير كافٍ لهذه الرسوم!',
    getCoins: 'احصل على كوينز',
`;

content = content.replace(/allGames: 'All Games',/, en + "\n    allGames: 'All Games',");
content = content.replace(/allGames: 'Tous les Jeux',/, fr + "\n    allGames: 'Tous les Jeux',");
content = content.replace(/allGames: 'جميع الألعاب',/, ar + "\n    allGames: 'جميع الألعاب',");

fs.writeFileSync('src/lib/i18n.ts', content);
