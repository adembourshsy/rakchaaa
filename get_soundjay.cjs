const https = require('https');
async function search(q) {
  return new Promise((resolve) => {
    https.get(`https://www.soundjay.com/search?q=${encodeURIComponent(q)}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const regex = /data-track="([^"]+\.mp3)"/;
        const match = data.match(regex);
        resolve({q, url: match ? 'https://www.soundjay.com' + match[1] : null});
      });
    }).on('error', () => resolve({q, url: null}));
  });
}
const queries = ['fire', 'kiss', 'explosion', 'applause', 'clown', 'growl', 'tada', 'ghost', 'trumpet', 'cash register', 'rocket', 'evil', 'bugle', 'slap'];
(async () => {
  for (let q of queries) {
    const res = await search(q);
    console.log(`${q}: ${res.url}`);
  }
})();
