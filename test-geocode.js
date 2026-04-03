const fetch = require('node-fetch');
async function test() {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=49.5584879&lon=-1.840117`;
  const response = await fetch(url, { headers: { 'User-Agent': 'YouTube-Video-App/1.0' } });
  const data = await response.json();
  console.log(data.address);
}
test();
