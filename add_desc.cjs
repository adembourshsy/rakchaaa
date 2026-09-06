const fs = require('fs');

let content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

const descEn = `
    gameDesc_mecanque: 'Identify the car from progressive clues (origin, specs, engine sound, model). Secret answers, host validation, and multi-player speed rounds!',
    gameDesc_uno_game: 'Classic UNO with deep tactical rules, rapid action, dynamic voice declaration, and swift counter-attacks on a premium interactive board.',
    gameDesc_intrus: 'Find the impostor among your friends! Everyone gets a secret word except one person. Ask questions, vote, and uncover the Intrus.',
    gameDesc_mind_rally: 'The ultimate Tunisian truth or dare social game with engaging questions, playful dares, and spontaneous fun for friends.',
    gameDesc_chess: 'Complete and fully legal FIDE Chess rules engine featuring castling, en passant, pawn promotion, checkmate detection, move history, and smart AI.',
    gameDesc_belote: 'Traditional 32-card Belote & Baloot card game with Tunisian rules, bidding (Talba), and trumps. Coming soon on Rakcha!',
    gameDesc_coming_soon: 'A new game is currently in preparation and development. Stay tuned!',
`;

const descFr = `
    gameDesc_mecanque: 'Identifiez la voiture grâce à des indices (origine, caractéristiques, son du moteur, modèle).',
    gameDesc_uno_game: 'Le classique UNO avec des règles tactiques, des déclarations vocales dynamiques et des contre-attaques rapides.',
    gameDesc_intrus: 'Trouvez l\\'imposteur parmi vos amis ! Posez des questions, votez et démasquez l\\'Intrus.',
    gameDesc_mind_rally: 'L\\'ultime jeu de l\\'action ou vérité tunisien avec des défis amusants pour vos amis.',
    gameDesc_chess: 'Jeu d\\'échecs complet avec règles FIDE, roque, prise en passant, promotion, historique et IA.',
    gameDesc_belote: 'Jeu de cartes traditionnel Belote (32 cartes) avec les règles tunisiennes (Talba, Atout).',
    gameDesc_coming_soon: 'Une nouvelle partie en cours de préparation et développement. Restez branchés !',
`;

const descAr = `
    gameDesc_mecanque: 'تعرف على السيارة من خلال التلميحات التدريجية (الأصل، المواصفات، صوت المحرك، الطراز). إجابات سرية، تحقق من المضيف!',
    gameDesc_uno_game: 'لعبة الأونو الكلاسيكية مع قواعد تكتيكية عميقة، حركات سريعة، وهجمات مرتدة سريعة على لوحة تفاعلية.',
    gameDesc_intrus: 'ابحث عن الدخيل بين أصدقائك! الجميع يحصل على كلمة سرية باستثناء شخص واحد. اسأل، صوّت، واكشف الدخيل.',
    gameDesc_mind_rally: 'لعبة الصراحة أو التحدي التونسية المطلقة مع أسئلة ممتعة وتحديات مرحة للأصدقاء.',
    gameDesc_chess: 'محرك شطرنج كامل بقواعد FIDE القانونية، يشمل التبييت، الأسر بالتجاوز، الترقية، وتاريخ النقلات.',
    gameDesc_belote: 'لعبة البيلوت التقليدية مع القواعد التونسية (الطلبة والآتوت). قريباً على ركشة!',
    gameDesc_coming_soon: 'لعبة جديدة قيد التحضير والتطوير. ابقوا معنا!',
`;

content = content.replace(/allGames: 'All Games',/, "allGames: 'All Games',\n" + descEn);
content = content.replace(/allGames: 'Tous les Jeux',/, "allGames: 'Tous les Jeux',\n" + descFr);
content = content.replace(/allGames: 'جميع الألعاب',/, "allGames: 'جميع الألعاب',\n" + descAr);

fs.writeFileSync('src/lib/i18n.ts', content);
