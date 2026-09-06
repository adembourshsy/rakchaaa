const fs = require('fs');
let content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

content = content.replace(/comingSoonTag: 'Coming Soon',/, "comingSoonTag: 'Coming Soon',\n    comingSoonBadge: 'Coming Soon',\n    stayTuned: '🚧 Stay Tuned 🚧',");
content = content.replace(/comingSoonTag: 'Bientôt Disponible',/, "comingSoonTag: 'Bientôt Disponible',\n    comingSoonBadge: 'Bientôt',\n    stayTuned: '🚧 Restez à l\\'écoute 🚧',");
content = content.replace(/comingSoonTag: 'قيد التحضير',/, "comingSoonTag: 'قيد التحضير',\n    comingSoonBadge: 'قيد التحضير',\n    stayTuned: '🚧 قيد التحضير 🚧',");

fs.writeFileSync('src/lib/i18n.ts', content);
