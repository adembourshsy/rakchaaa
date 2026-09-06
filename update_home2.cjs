const fs = require('fs');
let content = fs.readFileSync('src/components/views/HomeView.tsx', 'utf8');

content = content.replace(/<span>قيد التحضير \(Coming Soon\)<\/span>/g, "<span>{t('comingSoonBadge')}</span>");
content = content.replace(/🚧 قيد التحضير • Stay Tuned/g, "{t('stayTuned')}");

fs.writeFileSync('src/components/views/HomeView.tsx', content);
