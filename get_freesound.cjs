const https = require('https');

const queries = ['fire ignite', 'kiss', 'explosion', 'applause', 'clown horn', 'growl', 'party horn', 'ghost wail', 'trumpet fanfare', 'cash register', 'rocket launch', 'evil laugh', 'bugle call', 'slap'];

async function search(q) {
  return new Promise((resolve) => {
    https.get(`https://freesound.org/search/?q=${encodeURIComponent(q)}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const regex = /https:\/\/cdn\.freesound\.org\/previews\/[^"]+\.mp3/;
        const match = data.match(regex);
        resolve({q, url: match ? match[0] : null});
      });
    }).on('error', () => resolve({q, url: null}));
  });
}

(async () => {
  for (let q of queries) {
    const res = await search(q);
    console.log(`${q}: ${res.url}`);
  }
})();
