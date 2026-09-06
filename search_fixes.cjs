const https = require('https');
async function search(q) {
  return new Promise((resolve) => {
    https.get(`https://www.myinstants.com/en/search/?name=${encodeURIComponent(q)}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const regex = /\/media\/sounds\/[^"]+\.mp3/;
        const match = data.match(regex);
        resolve({q, url: match ? 'https://www.myinstants.com' + match[0] : null});
      });
    }).on('error', () => resolve({q, url: null}));
  });
}
const queries = ['trumpet fanfare', 'cash register'];
(async () => {
  for (let q of queries) {
    const res = await search(q);
    console.log(`${q}: ${res.url}`);
  }
})();
