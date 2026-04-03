const config = require('./config.js');
const fetch = require('node-fetch');

async function test() {
  const channelId = 'UCynoa1DjwnvHAowA_jiMEAQ';
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&order=date&maxResults=5&type=video&channelId=${channelId}&key=${config.youtubeApiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  const videoIds = searchData.items.map(item => item.id.videoId).join(',');
  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails,localizations&id=${videoIds}&key=${config.youtubeApiKey}`;
  const videosRes = await fetch(videosUrl);
  const videosData = await videosRes.json();
  console.log(JSON.stringify(videosData.items[0].recordingDetails, null, 2));
  console.log(JSON.stringify(videosData.items[0].snippet, null, 2));
}
test();
