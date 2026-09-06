const fs = require('fs');
let content = fs.readFileSync('src/components/views/ProfileView.tsx', 'utf8');

content = content.replace(/\{language === 'ar' \? 'متجر تفاعلات الإيموجي والصوت' : 'Emoji & Sound Shop'\}/g, "{t('emojiAndSoundShop')}");
content = content.replace(/\{language === 'ar'\s*\n\s*\? 'اكتشف تفاعلات متحركة حصرية ومؤثرات صوتية للتعبير عن نفسك داخل الألعاب.'\s*\n\s*: 'Discover exclusive animated reactions and SFX items to express yourself inside the multiplayer games.'\}/g, "{t('discoverExclusiveShopItems')}");
content = content.replace(/\{language === 'ar' \? 'المتجر' : 'Shop'\}/g, "{t('shop')}");

fs.writeFileSync('src/components/views/ProfileView.tsx', content);
