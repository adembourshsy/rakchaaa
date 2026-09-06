const https = require('https');
const url = 'https://www.myinstants.com/media/sounds/smoochykiss.mp3';
https.request(url, {method: 'HEAD'}, (res) => {
  console.log(`${res.statusCode} ${url}`);
}).on('error', () => console.log(`Error ${url}`)).end();
