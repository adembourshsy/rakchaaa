const https = require('https');
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
const queries = ['cash', 'horn', 'fanfare', 'ghost', 'rocket', 'evil', 'bugle', 'applause', 'clown', 'growl'];
(async () => {
  for (let q of queries) {
    const res = await search(q);
    console.log(`${q}: ${res.url}`);
  }
})();
