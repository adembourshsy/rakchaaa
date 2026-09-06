const fs = require('fs');

let content = fs.readFileSync('src/components/views/HomeView.tsx', 'utf8');

content = content.replace(/'Coming Soon \\(قيد التحضير\\)'/g, "t('comingSoonTag')");
content = content.replace(/'SOON'/g, "t('soon')");

fs.writeFileSync('src/components/views/HomeView.tsx', content);
