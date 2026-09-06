const fs = require('fs');
let content = fs.readFileSync('src/components/modals/RankUnlockModal.tsx', 'utf8');

content = content.replace(/\{language === 'ar' \? 'إنجاز جديد' : 'NEW RANK UNLOCKED'\}/g, "{t('newRankUnlocked') || 'NEW RANK UNLOCKED'}");
content = content.replace(/language === 'ar'\s*\n\s*\? `لقد وصلت إلى التصنيف \$\{rankMap\[rank\]\.name\}! أداؤك المذهل يضعك بين أفضل اللاعبين.`\s*\n\s*: `You\\'ve reached \$\{rankMap\[rank\]\.name\}! Your incredible performance puts you among the elite players.`/g, "t('rankReachedDesc') ? t('rankReachedDesc').replace('{rank}', rankMap[rank].name) : `You've reached ${rankMap[rank].name}! Your incredible performance puts you among the elite players.`");

content = content.replace(/language === 'ar'\s*\n\s*\? 'إطار صورة أفاتار حصري'\s*\n\s*: 'Exclusive Avatar Border'/g, "t('exclusiveAvatarBorder') || 'Exclusive Avatar Border'");
content = content.replace(/language === 'ar'\s*\n\s*\? 'أفضلية في ترتيب اللاعبين'\s*\n\s*: 'Priority Matchmaking'/g, "t('priorityMatchmaking') || 'Priority Matchmaking'");
content = content.replace(/language === 'ar'\s*\n\s*\? 'شارة تصنيف خاصة'\s*\n\s*: 'Special Rank Badge'/g, "t('specialRankBadge') || 'Special Rank Badge'");

content = content.replace(/\{language === 'ar' \? 'متابعة اللعب' : 'Awesome, Let’s Play!'\}/g, "{t('awesomeLetsPlay') || 'Awesome, Let’s Play!'}");

fs.writeFileSync('src/components/modals/RankUnlockModal.tsx', content);
