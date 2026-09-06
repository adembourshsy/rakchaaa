const fs = require('fs');

let home = fs.readFileSync('src/components/views/HomeView.tsx', 'utf8');
home = home.replace(/\{game\.description\}/g, "{t('gameDesc_' + game.id.replace('-', '_')) || game.description}");
fs.writeFileSync('src/components/views/HomeView.tsx', home);

let rooms = fs.readFileSync('src/components/views/RoomsView.tsx', 'utf8');
rooms = rooms.replace(/\{game\.description\}/g, "{t('gameDesc_' + game.id.replace('-', '_')) || game.description}");
fs.writeFileSync('src/components/views/RoomsView.tsx', rooms);
