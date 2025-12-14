const mineflayer = require('mineflayer');
const express = require('express');

const app = express();
const PORT = 10000;

app.get('/', (req, res) => {
  res.send('Aternos Bot v2 - Proxy Destekli!');
});

app.listen(PORT, () => {
  console.log('Web sunucu calisiyor: ' + PORT);
});

const SERVER_HOST = 'iamsofiathefirsttt.aternos.me';
const SERVER_PORT = 25565;

let botActive = false;
let connectionAttempts = 0;
let successfulConnections = 0;

function createBot() {
  if (botActive) {
    console.log('Bot zaten aktif, bekleniyor...');
    return;
  }

  connectionAttempts++;
  const BOT_USERNAME = 'Player' + Math.floor(Math.random() * 10000);

  console.log('\n========================================');
  console.log('BAGLANTI DENEMESI #' + connectionAttempts);
  console.log('Bot ismi: ' + BOT_USERNAME);
  console.log('Basarili baglanti: ' + successfulConnections);
  console.log('========================================');
  
  botActive = true;

  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: BOT_USERNAME,
    version: '1.19.2',
    auth: 'offline',
    checkTimeoutInterval: 60000,
    connectTimeout: 90000,
    hideErrors: false
  });

  let loginTimeout = setTimeout(() => {
    console.log('90 saniye gecti, baglanti kurulamadi!');
    bot.quit();
    botActive = false;
  }, 90000);

  bot.on('login', () => {
    clearTimeout(loginTimeout);
    successfulConnections++;
    console.log('========================================');
    console.log('>>> BASARILI GIRIS! <<<');
    console.log('Bot: ' + BOT_USERNAME);
    console.log('Toplam basarili giris: ' + successfulConnections);
    console.log('========================================');
    
    setTimeout(() => {
      console.log('60 saniye doldu, bot ayrilacak...');
      try {
        bot.quit();
      } catch (e) {
        console.log('Quit hatasi: ' + e.message);
      }
    }, 60000);
  });

  bot.on('spawn', () => {
    console.log('Bot spawn oldu!');
  });

  bot.on('kicked', (reason) => {
    clearTimeout(loginTimeout);
    console.log('Bot atildi: ' + reason);
    botActive = false;
  });

  bot.on('error', (err) => {
    clearTimeout(loginTimeout);
    console.log('HATA: ' + err.message);
    
    if (err.message.includes('ETIMEDOUT')) {
      console.log('>>> TIMEOUT HATASI - Aternos sunucusu yanitlamiyor <<<');
    } else if (err.message.includes('ECONNREFUSED')) {
      console.log('>>> BAGLANTI REDDEDILDI - Sunucu kapali olabilir <<<');
    }
    
    botActive = false;
  });

  bot.on('end', () => {
    clearTimeout(loginTimeout);
    console.log('Bot baglantisi sona erdi');
    botActive = false;
  });
}

console.log('========================================');
console.log('ATERNOS BOT SISTEMI BASLADI');
console.log('Hedef: ' + SERVER_HOST);
console.log('========================================');

setTimeout(() => {
  console.log('Ilk bot 20 saniye sonra baslatiliyor...');
}, 2000);

setTimeout(() => {
  createBot();
}, 20000);

setInterval(() => {
  if (!botActive) {
    console.log('\n[SISTEM] 2 dakika beklendi, yeni deneme basliyor...');
    createBot();
  } else {
    console.log('[SISTEM] Bot aktif, bekleniyor...');
  }
}, 120000);

setInterval(() => {
  console.log('\n[DURUM] Aktif: ' + botActive + ' | Deneme: ' + connectionAttempts + ' | Basarili: ' + successfulConnections);
}, 30000);
