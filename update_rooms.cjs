const fs = require('fs');
let content = fs.readFileSync('src/components/views/RoomsView.tsx', 'utf8');

content = content.replace(/\{t\('socialLobbyDesc'\) \|\| 'Join public tables or create private rooms to play with friends.'\}/g, "{t('socialLobbyDesc')}");
content = content.replace(/\{t\('enterCode'\) \|\| 'ENTER PRIVATE ROOM CODE'\}/g, "{t('enterPrivateRoomCode')}");
content = content.replace(/t\('enterCodePlaceholder'\) \|\| 'e.g. RK-9842'/g, "t('enterCodePlaceholder')");
content = content.replace(/\{t\('allGames'\) \|\| 'All Games'\}/g, "{t('allGames')}");
content = content.replace(/\{activeTabType === 'public'\s*\n\s*\?\s*'No Public Tables Open Right Now'\s*\n\s*:\s*'You have no active joined tables'\}/g, "{activeTabType === 'public' ? t('noPublicTablesOpen') : t('noActiveJoinedTables')}");
content = content.replace(/\{activeTabType === 'public'\s*\n\s*\?\s*'Be the first host! Create a lounge and invite your friends to start playing.'\s*\n\s*:\s*'Create a room to host a new match, or browse open public tables.'\}/g, "{activeTabType === 'public' ? t('beFirstHost') : t('createRoomOrBrowse')}");

fs.writeFileSync('src/components/views/RoomsView.tsx', content);
