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

let botActive = false;

function createBot() {
  if (botActive) {
    console.log('Bot zaten aktif, bekleniyor...');
    return;
  }

  const BOT_USERNAME = 'Bot' + Math.floor(Math.random() * 10000);

  console.log('\n=== YENi BOT OLUSTURULUYOR ===');
  console.log('Sunucu: ' + SERVER_HOST + ':' + SERVER_PORT);
  console.log('Bot ismi: ' + BOT_USERNAME);
  
  botActive = true;

  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: BOT_USERNAME,
    version: false,
    auth: 'offline',
    connectTimeout: 60000
  });

  bot.on('login', () => {
    console.log('>>> BOT OYUNA GIRDI: ' + BOT_USERNAME + ' <<<');
    console.log('Konum: (' + bot.entity.position.x + ', ' + bot.entity.position.y + ', ' + bot.entity.position.z + ')');
    
    setTimeout(() => {
      console.log('45 saniye doldu, bot cikis yapiyor...');
      bot.quit();
    }, 45000);
  });

  bot.on('spawn', () => {
    console.log(BOT_USERNAME + ' spawn oldu!');
  });

  bot.on('chat', (username, message) => {
    console.log('Chat: <' + username + '> ' + message);
  });

  bot.on('kicked', (reason) => {
    console.log('Bot kicklendi: ' + reason);
    botActive = false;
  });

  bot.on('error', (err) => {
    console.log('Bot hatasi: ' + err.message);
    botActive = false;
  });

  bot.on('end', () => {
    console.log(BOT_USERNAME + ' baglantisi kapandi');
    botActive = false;
  });
}

console.log('=== ATERNOS MINECRAFT BOT BASLADI ===');

setTimeout(() => {
  console.log('Ilk bot 15 saniye sonra baslatiliyor...');
}, 1000);

setTimeout(() => {
  createBot();
}, 15000);

setInterval(() => {
  if (!botActive) {
    console.log('\n--- Yeni baglanti denemesi (2dk sonra) ---');
    createBot();
  }
}, 120000);
