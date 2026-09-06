const fs = require('fs');

let content = fs.readFileSync('src/components/ui/EntryCostSelector.tsx', 'utf8');

content = content.replace(/\{language === 'ar' \? 'رسوم الدخول \(Entry Cost\)' : 'Entry Fee'\}/g, "{t('entryFeeLabel') || 'Entry Fee'}");
content = content.replace(/\{language === 'ar' \? \`رصيدك: \$\{currentCoins\}\` : \`Balance: \$\{currentCoins\}\`\}/g, "{t('balanceLabel') ? t('balanceLabel').replace('{coins}', currentCoins.toString()) : `Balance: ${currentCoins}`}");
content = content.replace(/\{cost === 0 \? \(language === 'ar' \? 'مجاني' : 'Free'\) : cost\}/g, "{cost === 0 ? (t('freeLabel') || 'Free') : cost}");
content = content.replace(/\{language === 'ar'\s*\n\s*\? 'رصيدك الحالي غير كافٍ لهذه الرسوم!'\s*\n\s*: 'Insufficient coins balance for this entry cost!'\}/g, "{t('insufficientCoins') || 'Insufficient coins balance for this entry cost!'}");
content = content.replace(/\{language === 'ar' \? 'احصل على كوينز' : 'Get Coins'\}/g, "{t('getCoins') || 'Get Coins'}");

fs.writeFileSync('src/components/ui/EntryCostSelector.tsx', content);
