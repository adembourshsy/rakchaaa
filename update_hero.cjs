const fs = require('fs');
let content = fs.readFileSync('src/components/ui/Hero3DShowcase.tsx', 'utf8');

content = content.replace(/\{language === 'ar' \? 'ألعاب الورق التونسية' : 'AUTHENTIC TUNISIAN CARD GAMES'\}/g, "{t('authenticCardGames')}");
content = content.replace(/\{language === 'ar' \? 'لعب جماعي' : 'MULTIPLAYER'\}/g, "{t('multiplayer')}");
content = content.replace(/\{language === 'ar' \? 'تصنيف مباشر' : 'LIVE STREAKS'\}/g, "{t('liveStreaks')}");

content = content.replace(/\{language === 'ar'\s*\n\s*\? \([\s\S]*?\)\s*\n\s*: \([\s\S]*?\)\}/g, "{t('heroTagline')}");

fs.writeFileSync('src/components/ui/Hero3DShowcase.tsx', content);
