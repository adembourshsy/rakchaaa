const https = require('https');
async function search(q) {
  return new Promise((resolve) => {
    https.get(`https://freesound.org/search/?q=${encodeURIComponent(q)}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const regex = /https:\/\/cdn\.freesound\.org\/previews\/[0-9]+\/[0-9]+_[0-9]+-hq\.mp3/;
        let match = data.match(regex);
        if(!match) {
           const regex2 = /https:\/\/cdn\.freesound\.org\/previews\/[^"]+\.mp3/;
           match = data.match(regex2);
        }
        resolve({q, url: match ? match[0] : null});
      });
    }).on('error', () => resolve({q, url: null}));
  });
}
const queries = ['laugh', 'trumpet', 'monster', 'wail', 'space', 'victory'];
(async () => {
  for (let q of queries) {
    const res = await search(q);
    console.log(`${q}: ${res.url}`);
  }
})();
