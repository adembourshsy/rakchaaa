const fs = require('fs');
let content = fs.readFileSync('src/components/views/WaitingRoomView.tsx', 'utf8');

content = content.replace(/\{language === 'ar' \? 'تعديل الإعدادات' : language === 'fr' \? 'Paramètres' : 'Parameters'\}/g, "{t('parameters')}");
content = content.replace(/\{isHost \? \(language === 'ar' \? 'يمكنك التعديل' : 'Host can edit'\) : \(language === 'ar' \? 'إعدادات المضيف' : 'Host configured'\)\}/g, "{isHost ? t('hostCanEdit') : t('hostConfigured')}");
content = content.replace(/\{language === 'ar' \? 'قوانين ودليل مباراة البيلوت' : language === 'fr' \? 'GUIDE DE JEU BELOTE' : 'BELOTE GAME GUIDE'\}/g, "{t('beloteGameGuideTitle')}");
content = content.replace(/\{language === 'ar' \? 'الطلبة، الآتوت، والمزايدة' : 'Talba, Atout, Belote\/Rebelote'\}/g, "{t('beloteGameGuideDesc')}");
content = content.replace(/\{language === 'ar' \? 'دليل اللعب ←' : language === 'fr' \? 'GUIDE →' : 'GUIDE →'\}/g, "{t('guideBtn')}");
content = content.replace(/\? \(language === 'ar' \? 'قوانين ودليل لعبة ميكانيك' : language === 'fr' \? 'RÈGLES DU JEU MECANQUE' : 'MECANQUE GAME RULES & GUIDE'\)/g, "? t('mecanqueGameRulesTitle')");
content = content.replace(/: \(language === 'ar' \? 'قوانين اللعبة وأنواع البطاقات' : language === 'fr' \? 'RÈGLES DU JEU ET TYPES DE CARTES' : 'GAME RULES & CARD TYPES'\)/g, ": t('gameRulesAndCardTypesTitle')");
content = content.replace(/\? \(language === 'ar' \? 'اضغط لعرض إعدادات المباراة، مراحل التلميحات، ونظام النقاط' : language === 'fr' \? 'Appuyez pour voir les paramètres, étapes d\\'indices et calcul des points' : 'Tap to view match settings, clue stages, cars & scoring guide'\)/g, "? t('mecanqueGameRulesDesc')");
content = content.replace(/: \(language === 'ar' \? 'اضغط لعرض الدليل التفاعلي للبطاقات' : language === 'fr' \? 'Appuyez pour voir le guide animé des cartes' : 'Tap to view game guide'\)/g, ": t('tapToViewGameGuide')");
content = content.replace(/const btnView = isAr \? '\[ عرض القواعد \]' : language === 'fr' \? '\[ Voir les règles \]' : '\[ View Rules \]';/g, "const btnView = t('viewRulesBtn');");
content = content.replace(/const btnClose = isAr \? '\[ إغلاق القواعد \]' : language === 'fr' \? '\[ Fermer les règles \]' : '\[ Close Rules \]';/g, "const btnClose = t('closeRulesBtn');");
content = content.replace(/const titleLabel = isAr \? 'قوانين اللعبة' : language === 'fr' \? 'Règles du jeu' : 'Game Rules';/g, "const titleLabel = t('gameRules');");

// The multiline ternary blocks for minPlayersReq, waitingForAllPlayersReady, waitingForHostToStart:
content = content.replace(/\{language === 'ar'\s*\n\s*\? `يلزم \$\{minPlayersNeeded\} لاعبين على الأقل للبدء \(\$\{joinedRoom\.players\.length\}\/\$\{minPlayersNeeded\}\)`\s*\n\s*: language === 'fr'\s*\n\s*\? `Au moins \$\{minPlayersNeeded\} joueurs requis pour lancer \(\$\{joinedRoom\.players\.length\}\/\$\{minPlayersNeeded\}\)`\s*\n\s*: `At least \$\{minPlayersNeeded\} player\$\{minPlayersNeeded > 1 \? 's' : ''\} required to start \(\$\{joinedRoom\.players\.length\}\/\$\{minPlayersNeeded\}\)`\}/g, 
  "{minPlayersNeeded > 1 ? t('minPlayersReq').replace('{count}', minPlayersNeeded.toString()).replace('{ready}', joinedRoom.players.length.toString()) : t('minPlayerReqSingular').replace('{count}', minPlayersNeeded.toString()).replace('{ready}', joinedRoom.players.length.toString())}");

content = content.replace(/\{language === 'ar'\s*\n\s*\? `في انتظار جهوزية جميع اللاعبين \(\$\{readyPlayersCount\}\/\$\{otherPlayers\.length\} جاهز\)`\s*\n\s*: language === 'fr'\s*\n\s*\? `En attente que tous les joueurs soient prêts \(\$\{readyPlayersCount\}\/\$\{otherPlayers\.length\} prêts\)`\s*\n\s*: `Waiting for all players to be ready \(\$\{readyPlayersCount\}\/\$\{otherPlayers\.length\} ready\)`\}/g,
  "{t('waitingForAllPlayersReady').replace('{ready}', readyPlayersCount.toString()).replace('{total}', otherPlayers.length.toString())}");

content = content.replace(/\{language === 'ar'\s*\n\s*\? 'في انتظار قيام المضيف ببدء اللعبة\.\.\.'\s*\n\s*: language === 'fr'\s*\n\s*\? "En attente de l'hôte pour lancer la partie\.\.\."\s*\n\s*: 'Waiting for host to start the game\.\.\.'\}/g,
  "{t('waitingForHostToStart')}");

fs.writeFileSync('src/components/views/WaitingRoomView.tsx', content);
