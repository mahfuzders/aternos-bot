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
  
  const BOT_USERNAME = 'Bot' + Math.floor(Math.random() * 100000);
  
  console.log('\n=== YENi BOT OLUSTURULUYOR ===');
  console.log('Bot ismi: ' + BOT_USERNAME);
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
    console.log('>>> BOT OYUNA GIRDI: ' + BOT_USERNAME + ' <<<');
    console.log('Konum: ' + bot.entity.position);
    
    setTimeout(() => {
      console.log('1 dakika doldu, ' + BOT_USERNAME + ' cikiyor...');
      bot.quit();
    }, 60000);
  });
  
  bot.on('spawn', () => {
    console.log(BOT_USERNAME + ' spawn oldu!');
  });
  
  bot.on('chat', (username, message) => {
    console.log('Chat: <' + username + '> ' + message);
  });
  
  bot.on('kicked', (reason) => {
    console.log(BOT_USERNAME + ' kicklendi: ' + reason);
    botActive = false;
    setTimeout(createBot, 5000);
  });
  
  bot.on('error', (err) => {
    console.log(BOT_USERNAME + ' hatasi: ' + err.message);
    botActive = false;
    setTimeout(createBot, 5000);
  });
  
  bot.on('end', () => {
    console.log(BOT_USERNAME + ' baglantisi kapandi');
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
```

---

## ✅ Bu Kodda:

**İlk başlangıç:** 20 saniye ✅
**Bot süresi:** 1 dakika içeride ✅
**Yeniden bağlanma:** 5 saniye sonra ✅
**Random isim:** Her seferinde farklı ✅
**Tek bot:** Aynı anda sadece 1 ✅

---

## ⏱️ Nasıl Çalışır:
```
0:00 → Deploy başlar
0:20 → Bot1 girer
1:20 → Bot1 çıkar
1:25 → Bot2 girer (5 saniye sonra)
2:25 → Bot2 çıkar
2:30 → Bot3 girer
...
