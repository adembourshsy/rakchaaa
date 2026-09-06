const https = require('https');
https.get('https://pixabay.com/sound-effects/search/emoji/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const regex = /https:\/\/cdn\.pixabay\.com\/audio\/[^"]+\.mp3/g;
    const matches = data.match(regex);
    console.log(matches ? matches.slice(0, 10) : 'No matches found');
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
