const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const PORT = 10000;

app.get('/', (req, res) => {
  res.send('Aternos Minecraft Bot Calisiyor!');
});

app.listen(PORT, () => {
  console.log('Web sunucu calisiyor: ' + PORT);
});

const SERVER_HOST = 'iamsofiathefirsttt.aternos.me';
const SERVER_PORT = 25565;
const BOT_USERNAME = 'Bot' + Math.floor(Math.random() * 10000);
let botActive = false;

function createBot() {
  if (botActive) {
    console.log('Bot zaten aktif, bekleniyor...');
    return;
  }
  
  console.log('\n=== YENi BOT OLUSTURULUYOR ===');
  console.log('Sunucu: ' + SERVER_HOST + ':' + SERVER_PORT);
  
  botActive = true;
  
  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: BOT_USERNAME,
    version: false,
    auth: 'offline',
    connectTimeout: 120000,
    checkTimeoutInterval: 300000
  });
  
  bot.on('login', () => {
    console.log('>>> BOT OYUNA GIRDI! <<<');
    console.log('Konum: ' + bot.entity.position);
  });
  
  bot.on('spawn', () => {
    console.log('Bot spawn oldu!');
  });
  
  bot.on('chat', (username, message) => {
    console.log('Chat: <' + username + '> ' + message);
  });
  
  bot.on('kicked', (reason) => {
    console.log('Bot kicklendi: ' + reason);
    botActive = false;
    setTimeout(createBot, 5000);
  });
  
  bot.on('error', (err) => {
    console.log('Bot hatasi: ' + err.message);
    botActive = false;
    setTimeout(createBot, 5000);
  });
  
  bot.on('end', () => {
    console.log('Bot baglantisi kapandi');
    botActive = false;
    setTimeout(createBot, 5000);
  });
}

console.log('=== ATERNOS MINECRAFT BOT BASLADI ===');

setTimeout(() => {
  console.log('Ilk bot 20 saniye sonra baslatiliyor...');
}, 1000);

setTimeout(() => {
  createBot();
}, 20000);
