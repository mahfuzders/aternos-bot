const mineflayer = require('mineflayer');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Bot konfigürasyonu
let config = {
  host: 'iamsofiathefirsttt.aternos.me',
  port: 25565,
  version: '1.20.4',
  minStayTime: 60,        // saniye
  maxStayTime: 120,       // saniye
  minWaitTime: 30,        // saniye
  maxWaitTime: 90,        // saniye
  enableMovement: true,
  autoReconnect: true
};

let bot = null;
let isConnecting = false;
let shouldReconnect = true;
let botStats = {
  totalConnections: 0,
  successfulLogins: 0,
  kicks: 0,
  errors: 0,
  currentUsername: null,
  lastConnectTime: null,
  uptime: 0
};

const startTime = Date.now();

// Web Dashboard - Ana Sayfa
app.get('/', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Minecraft Aternos Bot Kontrol Paneli</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .header {
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          margin-bottom: 20px;
        }
        .header h1 {
          color: #667eea;
          margin-bottom: 10px;
        }
        .status {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
        }
        .status.online { background: #10b981; color: white; }
        .status.offline { background: #ef4444; color: white; }
        .status.connecting { background: #f59e0b; color: white; }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .card {
          background: white;
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .card h2 {
          color: #667eea;
          margin-bottom: 15px;
          font-size: 20px;
        }
        .stat {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .stat:last-child { border-bottom: none; }
        .stat-label { color: #6b7280; font-weight: 500; }
        .stat-value { color: #111827; font-weight: bold; }
        
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #374151;
          font-weight: 600;
        }
        .form-group input, .form-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.3s;
        }
        .form-group input:focus, .form-group select:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .btn {
          padding: 12px 25px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          margin-right: 10px;
          margin-bottom: 10px;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .btn-primary { background: #667eea; color: white; }
        .btn-success { background: #10b981; color: white; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-warning { background: #f59e0b; color: white; }
        .btn-secondary { background: #6b7280; color: white; }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }
        .checkbox-group input[type="checkbox"] {
          width: auto;
          cursor: pointer;
        }
        
        .log-box {
          background: #1f2937;
          color: #10b981;
          padding: 20px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          max-height: 400px;
          overflow-y: auto;
          white-space: pre-wrap;
        }
        
        @media (max-width: 768px) {
          .grid { grid-template-columns: 1fr; }
          .btn { width: 100%; margin-right: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎮 Minecraft Aternos Bot Kontrol Paneli</h1>
          <span class="status ${bot ? 'online' : (isConnecting ? 'connecting' : 'offline')}">
            ${bot ? '🟢 ONLINE' : (isConnecting ? '🟡 BAĞLANIYOR' : '🔴 OFFLINE')}
          </span>
          <p style="margin-top: 10px; color: #6b7280;">Uptime: ${hours}s ${minutes}d ${seconds}sn</p>
        </div>
        
        <div class="grid">
          <div class="card">
            <h2>📊 İstatistikler</h2>
            <div class="stat">
              <span class="stat-label">Toplam Bağlantı</span>
              <span class="stat-value">${botStats.totalConnections}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Başarılı Giriş</span>
              <span class="stat-value">${botStats.successfulLogins}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Kick Sayısı</span>
              <span class="stat-value">${botStats.kicks}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Hata Sayısı</span>
              <span class="stat-value">${botStats.errors}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Aktif Kullanıcı</span>
              <span class="stat-value">${botStats.currentUsername || 'Yok'}</span>
            </div>
          </div>
          
          <div class="card">
            <h2>⚙️ Sunucu Ayarları</h2>
            <form action="/api/config" method="POST">
              <div class="form-group">
                <label>Sunucu Host</label>
                <input type="text" name="host" value="${config.host}" required>
              </div>
              <div class="form-group">
                <label>Port</label>
                <input type="number" name="port" value="${config.port}" required>
              </div>
              <div class="form-group">
                <label>Minecraft Versiyonu</label>
                <select name="version">
                  <option value="1.20.4" ${config.version === '1.20.4' ? 'selected' : ''}>1.20.4</option>
                  <option value="1.20.1" ${config.version === '1.20.1' ? 'selected' : ''}>1.20.1</option>
                  <option value="1.19.4" ${config.version === '1.19.4' ? 'selected' : ''}>1.19.4</option>
                  <option value="1.18.2" ${config.version === '1.18.2' ? 'selected' : ''}>1.18.2</option>
                  <option value="1.16.5" ${config.version === '1.16.5' ? 'selected' : ''}>1.16.5</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary">💾 Kaydet</button>
            </form>
          </div>
          
          <div class="card">
            <h2>⏱️ Zaman Ayarları (saniye)</h2>
            <form action="/api/timing" method="POST">
              <div class="form-group">
                <label>Min Kalma Süresi</label>
                <input type="number" name="minStayTime" value="${config.minStayTime}" required>
              </div>
              <div class="form-group">
                <label>Max Kalma Süresi</label>
                <input type="number" name="maxStayTime" value="${config.maxStayTime}" required>
              </div>
              <div class="form-group">
                <label>Min Bekleme Süresi</label>
                <input type="number" name="minWaitTime" value="${config.minWaitTime}" required>
              </div>
              <div class="form-group">
                <label>Max Bekleme Süresi</label>
                <input type="number" name="maxWaitTime" value="${config.maxWaitTime}" required>
              </div>
              <button type="submit" class="btn btn-primary">💾 Kaydet</button>
            </form>
          </div>
        </div>
        
        <div class="card">
          <h2>🎛️ Bot Kontrolü</h2>
          <form action="/api/start" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-success" ${bot || isConnecting ? 'disabled' : ''}>▶️ Başlat</button>
          </form>
          <form action="/api/stop" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-danger" ${!bot && !isConnecting ? 'disabled' : ''}>⏹️ Durdur</button>
          </form>
          <form action="/api/restart" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-warning">🔄 Yeniden Başlat</button>
          </form>
          <form action="/api/stats-reset" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-secondary">📊 İstatistik Sıfırla</button>
          </form>
          
          <div class="checkbox-group">
            <input type="checkbox" id="autoReconnect" ${config.autoReconnect ? 'checked' : ''} onchange="toggleAutoReconnect(this.checked)">
            <label for="autoReconnect">Otomatik Yeniden Bağlan</label>
          </div>
          <div class="checkbox-group">
            <input type="checkbox" id="enableMovement" ${config.enableMovement ? 'checked' : ''} onchange="toggleMovement(this.checked)">
            <label for="enableMovement">Hareket Simülasyonu</label>
          </div>
        </div>
        
        <div class="card">
          <h2>📋 Canlı Loglar</h2>
          <div class="log-box" id="logs">Son loglar yükleniyor...</div>
        </div>
      </div>
      
      <script>
        function toggleAutoReconnect(enabled) {
          fetch('/api/toggle-reconnect', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({enabled})
          });
        }
        
        function toggleMovement(enabled) {
          fetch('/api/toggle-movement', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({enabled})
          });
        }
        
        // Otomatik sayfa yenileme (her 5 saniye)
        setTimeout(() => location.reload(), 5000);
      </script>
    </body>
    </html>
  `);
});

// API Endpoints
app.post('/api/config', (req, res) => {
  config.host = req.body.host;
  config.port = parseInt(req.body.port);
  config.version = req.body.version;
  console.log('⚙️ Konfigürasyon güncellendi:', config);
  res.redirect('/');
});

app.post('/api/timing', (req, res) => {
  config.minStayTime = parseInt(req.body.minStayTime);
  config.maxStayTime = parseInt(req.body.maxStayTime);
  config.minWaitTime = parseInt(req.body.minWaitTime);
  config.maxWaitTime = parseInt(req.body.maxWaitTime);
  console.log('⏱️ Zaman ayarları güncellendi:', config);
  res.redirect('/');
});

app.post('/api/start', (req, res) => {
  if (!bot && !isConnecting) {
    shouldReconnect = true;
    createBot();
  }
  res.redirect('/');
});

app.post('/api/stop', (req, res) => {
  shouldReconnect = false;
  cleanupBot();
  res.redirect('/');
});

app.post('/api/restart', (req, res) => {
  cleanupBot();
  setTimeout(() => {
    shouldReconnect = true;
    createBot();
  }, 2000);
  res.redirect('/');
});

app.post('/api/stats-reset', (req, res) => {
  botStats = {
    totalConnections: 0,
    successfulLogins: 0,
    kicks: 0,
    errors: 0,
    currentUsername: botStats.currentUsername,
    lastConnectTime: botStats.lastConnectTime,
    uptime: 0
  };
  console.log('📊 İstatistikler sıfırlandı');
  res.redirect('/');
});

app.post('/api/toggle-reconnect', (req, res) => {
  config.autoReconnect = req.body.enabled;
  shouldReconnect = req.body.enabled;
  console.log('🔄 Otomatik yeniden bağlanma:', config.autoReconnect ? 'Açık' : 'Kapalı');
  res.json({success: true});
});

app.post('/api/toggle-movement', (req, res) => {
  config.enableMovement = req.body.enabled;
  console.log('🏃 Hareket simülasyonu:', config.enableMovement ? 'Açık' : 'Kapalı');
  res.json({success: true});
});

app.get('/api/status', (req, res) => {
  res.json({
    bot: bot ? true : false,
    isConnecting,
    config,
    stats: botStats
  });
});

app.listen(PORT, () => {
  console.log('🌐 Web Dashboard çalışıyor: http://localhost:' + PORT);
});

// Bot Fonksiyonları
function getRandomUsername() {
  const prefixes = [
    'Dark','Shadow','Fire','Ice','Thunder','Storm','Night','Blood','Soul','Ghost',
    'Dragon','Wolf','Tiger','Lion','Eagle','Hawk','Raven','Phoenix','Demon','Angel',
    'King','Queen','Lord','Master','Legend','Epic','Super','Ultra','Mega','Hyper',
    'Pro','Ace','Elite','Prime','Alpha','Beta','Omega','Nova','Star','Sky','Moon',
    'Sun','Light','Void','Frost','Flame','Aqua','Terra','Aero','Metal'
  ];

  const suffixes = [
    'Slayer','Killer','Hunter','Destroyer','Breaker','Crusher','Reaper','Striker',
    'Warrior','Knight','Guardian','Champion','Hero','Legend','Master','Lord','King',
    'Dragon','Wolf','Tiger','Bear','Eagle','Blade','Sword','Rider','Walker','Runner',
    'Miner','Builder','Crafter','Gamer','Player'
  ];

  const styles = [
    () => prefixes[Math.floor(Math.random() * prefixes.length)] +
          suffixes[Math.floor(Math.random() * suffixes.length)] +
          Math.floor(Math.random() * 9999),

    () => prefixes[Math.floor(Math.random() * prefixes.length)] +
          Math.floor(Math.random() * 999) +
          suffixes[Math.floor(Math.random() * suffixes.length)],

    () => 'xX_' +
          prefixes[Math.floor(Math.random() * prefixes.length)] +
          suffixes[Math.floor(Math.random() * suffixes.length)] +
          '_Xx',

    () => prefixes[Math.floor(Math.random() * prefixes.length)] + '_' +
          suffixes[Math.floor(Math.random() * suffixes.length)] + '_' +
          Math.floor(Math.random() * 999),

    () => prefixes[Math.floor(Math.random() * prefixes.length)] +
          Math.floor(Math.random() * 99999)
  ];

  let username = styles[Math.floor(Math.random() * styles.length)]();
  return username.length > 16 ? username.substring(0, 16) : username;
}

function humanizeBot() {
  if (!bot || !config.enableMovement) return;

  try {
    const yaw = (Math.random() - 0.5) * 0.5;
    const pitch = (Math.random() - 0.5) * 0.2;
    bot.look(bot.entity.yaw + yaw, bot.entity.pitch + pitch, true);

    if (Math.random() < 0.1) {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 300);
    }

    const directions = ['forward', 'back', 'left', 'right'];
    const dir = directions[Math.floor(Math.random() * directions.length)];
    if (Math.random() < 0.2) {
      bot.setControlState(dir, true);
      setTimeout(() => bot.setControlState(dir, false), 1000 + Math.random() * 2000);
    }

    if (Math.random() < 0.1) {
      Object.keys(bot.controlState).forEach(key => bot.setControlState(key, false));
    }

    setTimeout(humanizeBot, 2000 + Math.random() * 3000);
  } catch (e) {
    // Bot kapalıysa hata vermesin
  }
}

function createBot() {
  if (bot || isConnecting) {
    console.log('⚠️ Bot zaten aktif');
    return;
  }

  isConnecting = true;
  botStats.totalConnections++;
  const username = getRandomUsername();
  botStats.currentUsername = username;
  botStats.lastConnectTime = new Date().toLocaleString('tr-TR');
  
  console.log('\n🤖 Yeni bot:', username);

  try {
    bot = mineflayer.createBot({
      host: config.host,
      port: config.port,
      username,
      version: config.version,
      auth: 'offline',
      hideErrors: false,
      checkTimeoutInterval: 30000,
      keepAlive: true
    });

    const connectionTimeout = setTimeout(() => {
      console.log('⏱️ Timeout');
      botStats.errors++;
      cleanupBot();
      
      if (config.autoReconnect) {
        const wait = config.minWaitTime * 1000 + Math.random() * (config.maxWaitTime - config.minWaitTime) * 1000;
        setTimeout(() => createBot(), wait);
      }
    }, 60000);

    bot.once('login', () => {
      clearTimeout(connectionTimeout);
      isConnecting = false;
      botStats.successfulLogins++;
      console.log('✅ Giriş:', username);

      const stayTime = config.minStayTime * 1000 + Math.random() * (config.maxStayTime - config.minStayTime) * 1000;
      console.log('⏱️ Kalma:', Math.floor(stayTime / 1000), 's');

      if (config.enableMovement) humanizeBot();

      setTimeout(() => {
        console.log('👋 Çıkış');
        try { bot.end(); } catch {}
      }, stayTime);
    });

    bot.once('spawn', () => {
      console.log('🎮 Spawn!');
    });

    bot.on('end', (reason) => {
      clearTimeout(connectionTimeout);
      console.log('❌ Kesildi:', reason || '?');
      cleanupBot();

      if (config.autoReconnect) {
        const wait = config.minWaitTime * 1000 + Math.random() * (config.maxWaitTime - config.minWaitTime) * 1000;
        console.log('⏳ Yeni bot:', Math.floor(wait / 1000), 's');
        setTimeout(() => createBot(), wait);
      }
    });

    bot.on('kicked', (reason) => {
      clearTimeout(connectionTimeout);
      botStats.kicks++;
      console.log('⚠️ Kick:', reason);
      cleanupBot();

      if (config.autoReconnect) {
        const wait = config.minWaitTime * 1000 + Math.random() * (config.maxWaitTime - config.minWaitTime) * 1000;
        setTimeout(() => createBot(), wait);
      }
    });

    bot.on('error', (err) => {
      clearTimeout(connectionTimeout);
      botStats.errors++;
      
      if (err.code === 'ECONNREFUSED') {
        console.log('⚠️ Sunucu kapalı');
      } else if (err.code === 'ECONNRESET') {
        console.log('⚠️ Bağlantı kesildi');
      } else {
        console.log('⚠️ Hata:', err.message);
      }

      cleanupBot();

      if (config.autoReconnect) {
        const wait = config.minWaitTime * 1000 + Math.random() * (config.maxWaitTime - config.minWaitTime) * 1000;
        console.log('⏳ Yeniden:', Math.floor(wait / 1000), 's');
        setTimeout(() => createBot(), wait);
      }
    });

  } catch (err) {
    botStats.errors++;
    console.log('⚠️ Bot hatası:', err.message);
    cleanupBot();

    if (config.autoReconnect) {
      const wait = config.minWaitTime * 1000 + Math.random() * (config.maxWaitTime - config.minWaitTime) * 1000;
      setTimeout(() => createBot(), wait);
    }
  }
}

function cleanupBot() {
  isConnecting = false;
  if (bot) {
    try {
      bot.removeAllListeners();
      bot.end();
    } catch {}
    bot = null;
  }
}

console.log('🚀 Minecraft Aternos Bot');
console.log('🌐 Dashboard: http://localhost:' + PORT);
console.log('🎯 Sunucu:', config.host);
console.log('📦 Versiyon:', config.version);

setTimeout(() => {
  if (config.autoReconnect) createBot();
}, 2000);

process.on('SIGINT', () => {
  console.log('\n⛔ Kapatılıyor...');
  shouldReconnect = false;
  cleanupBot();
  process.exit();
});

process.on('uncaughtException', (err) => {
  console.log('⚠️ Hata:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.log('⚠️ Promise hatası:', err.message);
});
