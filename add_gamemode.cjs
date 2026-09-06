const fs = require('fs');
let content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

const en = `
    editMode: 'Edit Mode',
    modeSetup: 'Mode Setup',
    dismiss: 'Dismiss',
    freeGameZeroCoins: 'Free Game • 0 Coins',
    noCoinEntryFee: 'No coin entry fee',
    ageVerification: '18+ Age Verification',
    ageMustBe18: 'You must be 18 years or older to play this mode.',
    back: 'Back',
    confirmAndStart: 'Confirm & Start',
`;
const fr = `
    editMode: 'Modifier le Mode',
    modeSetup: 'Configuration du Mode',
    dismiss: 'Fermer',
    freeGameZeroCoins: 'Jeu Gratuit • 0 Coins',
    noCoinEntryFee: 'Aucun frais d\\'entrée',
    ageVerification: 'Vérification de l\\'âge (18+)',
    ageMustBe18: 'Vous devez avoir 18 ans ou plus pour jouer à ce mode.',
    back: 'Retour',
    confirmAndStart: 'Confirmer & Commencer',
`;
const ar = `
    editMode: 'تعديل النمط',
    modeSetup: 'اختيار النمط',
    dismiss: 'إغلاق',
    freeGameZeroCoins: 'لعبة مجانية • 0 كوينز',
    noCoinEntryFee: 'بدون رسوم دخول',
    ageVerification: 'تأكيد الفئة العمرية (+18)',
    ageMustBe18: 'يجب أن يكون عمرك 18 عامًا أو أكثر للعب هذا النمط.',
    back: 'رجوع',
    confirmAndStart: 'موافق • ابدأ',
`;

content = content.replace(/allGames: 'All Games',/, en + "\n    allGames: 'All Games',");
content = content.replace(/allGames: 'Tous les Jeux',/, fr + "\n    allGames: 'Tous les Jeux',");
content = content.replace(/allGames: 'جميع الألعاب',/, ar + "\n    allGames: 'جميع الألعاب',");

fs.writeFileSync('src/lib/i18n.ts', content);
