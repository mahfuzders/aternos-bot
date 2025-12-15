const mineflayer = require('mineflayer');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'aternos-bot-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 saat
}));

// Admin bilgileri (değiştir!)
const ADMIN = {
  username: 'tahadoguu7',
  password: 'taha2009' // ⚠️ DEĞİŞTİR!
};

// Sunucular ve botlar
let servers = {}; // { serverId: { name, host, port, version, bots: [] } }
let bots = {}; // { botId: { bot, serverId, stats, isConnecting } }

const defaultConfig = {
  minStayTime: 90,
  maxStayTime: 180,
  minWaitTime: 30,
  maxWaitTime: 60,
  enableMovement: false,
  autoReconnect: true,
  maxBotsPerServer: 5 // Sunucu başına max bot
};

let config = { ...defaultConfig };

// Auth Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.redirect('/login');
}

// Login Sayfası
app.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/');
  }
  
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Girişi - Aternos Bot PRO</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .login-card {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 400px;
          width: 100%;
        }
        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .login-header h1 {
          color: #667eea;
          font-size: 32px;
          margin-bottom: 10px;
        }
        .login-header p {
          color: #6b7280;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #374151;
          font-weight: 600;
        }
        .form-group input {
          width: 100%;
          padding: 15px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }
        .btn {
          width: 100%;
          padding: 15px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn:hover {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102,126,234,0.4);
        }
        .error {
          background: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="login-card">
        <div class="login-header">
          <h1>🔐 Admin Panel</h1>
          <p>Aternos Bot PRO</p>
        </div>
        ${req.query.error ? '<div class="error">❌ Kullanıcı adı veya şifre hatalı!</div>' : ''}
        <form action="/login" method="POST">
          <div class="form-group">
            <label>👤 Kullanıcı Adı</label>
            <input type="text" name="username" required autofocus>
          </div>
          <div class="form-group">
            <label>🔑 Şifre</label>
            <input type="password" name="password" required>
          </div>
          <button type="submit" class="btn">🚀 Giriş Yap</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Login POST
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN.username && password === ADMIN.password) {
    req.session.authenticated = true;
    req.session.username = username;
    res.redirect('/');
  } else {
    res.redirect('/login?error=1');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Ana Dashboard
app.get('/', requireAuth, (req, res) => {
  const serverCount = Object.keys(servers).length;
  const totalBots = Object.keys(bots).length;
  const activeBots = Object.values(bots).filter(b => b.bot).length;
  
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard - Aternos Bot PRO</title>
      <style>
        ${getStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1>🤖 Aternos Bot PRO</h1>
            <p style="color: #6b7280; margin-top: 5px;">Hoş geldin, ${req.session.username}</p>
          </div>
          <div class="header-stats">
            <span class="stat-badge badge-primary">🖥️ Sunucu: ${serverCount}</span>
            <span class="stat-badge badge-success">🤖 Bot: ${totalBots}</span>
            <span class="stat-badge badge-warning">🟢 Aktif: ${activeBots}</span>
            <a href="/logout" class="btn btn-danger btn-small">🚪 Çıkış</a>
          </div>
        </div>
        
        <div class="tabs">
          <button class="tab active" onclick="window.location.href='/'">🏠 Sunucular</button>
          <button class="tab" onclick="window.location.href='/settings'">⚙️ Ayarlar</button>
          <button class="tab" onclick="window.location.href='/analytics'">📈 İstatistikler</button>
        </div>
        
        ${serverCount === 0 ? `
          <div class="alert alert-info">
            💡 <strong>Başlamak için:</strong> Aşağıdan "Yeni Sunucu Ekle" butonuna tıklayın!
          </div>
        ` : ''}
        
        <div class="grid">
          <div class="card add-server-card">
            <h2>➕ Yeni Sunucu Ekle</h2>
            <form action="/api/add-server" method="POST">
              <div class="form-group">
                <label>Sunucu Adı</label>
                <input type="text" name="name" placeholder="Örn: Ana Sunucu" required>
              </div>
              <div class="form-group">
                <label>Host</label>
                <input type="text" name="host" placeholder="örnek.aternos.me" required>
              </div>
              <div class="form-group">
                <label>Port</label>
                <input type="number" name="port" value="25565" required>
              </div>
              <div class="form-group">
                <label>Versiyon</label>
                <select name="version">
                  <option value="1.20.4">1.20.4</option>
                  <option value="1.20.1">1.20.1</option>
                  <option value="1.19.4">1.19.4</option>
                  <option value="1.18.2">1.18.2</option>
                  <option value="1.16.5">1.16.5</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary">💾 Sunucu Ekle</button>
            </form>
          </div>
          
          ${Object.entries(servers).map(([serverId, server]) => {
            const serverBots = Object.values(bots).filter(b => b.serverId === serverId);
            const activeBots = serverBots.filter(b => b.bot).length;
            const connectingBots = serverBots.filter(b => b.isConnecting).length;
            
            return `
              <div class="card server-card">
                <div class="server-header">
                  <div>
                    <h2>🖥️ ${server.name}</h2>
                    <p class="server-info">${server.host}:${server.port}</p>
                    <p class="server-info">Versiyon: ${server.version}</p>
                  </div>
                  <form action="/api/remove-server/${serverId}" method="POST" style="display: inline;">
                    <button type="submit" class="btn btn-danger btn-small" onclick="return confirm('Sunucuyu silmek istediğinize emin misiniz?')">🗑️</button>
                  </form>
                </div>
                
                <div class="bot-counter">
                  <span class="bot-count ${serverBots.length >= config.maxBotsPerServer ? 'bot-count-full' : ''}">
                    ${serverBots.length} / ${config.maxBotsPerServer} Bot
                  </span>
                  <div class="bot-status-mini">
                    <span class="status-dot status-online"></span> ${activeBots}
                    <span class="status-dot status-connecting"></span> ${connectingBots}
                    <span class="status-dot status-offline"></span> ${serverBots.length - activeBots - connectingBots}
                  </div>
                </div>
                
                <div class="bot-actions">
                  <form action="/api/add-bot/${serverId}" method="POST" style="display: inline;">
                    <button type="submit" class="btn btn-success btn-small" ${serverBots.length >= config.maxBotsPerServer ? 'disabled' : ''}>
                      ➕ Bot Ekle
                    </button>
                  </form>
                  <button onclick="window.location.href='/server/${serverId}'" class="btn btn-primary btn-small">
                    📋 Detay
                  </button>
                </div>
                
                ${serverBots.length > 0 ? `
                  <div class="bot-mini-list">
                    ${serverBots.slice(0, 3).map(bot => {
                      const status = bot.bot ? 'online' : (bot.isConnecting ? 'connecting' : 'offline');
                      return `
                        <div class="bot-mini-item">
                          <span class="status-dot status-${status}"></span>
                          <span>${bot.stats.username || 'Loading...'}</span>
                        </div>
                      `;
                    }).join('')}
                    ${serverBots.length > 3 ? `<div class="bot-mini-item">+${serverBots.length - 3} bot daha</div>` : ''}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <script>
        setTimeout(() => location.reload(), 5000);
      </script>
    </body>
    </html>
  `);
});

// Sunucu Detay Sayfası
app.get('/server/:serverId', requireAuth, (req, res) => {
  const serverId = req.params.serverId;
  const server = servers[serverId];
  
  if (!server) {
    return res.redirect('/');
  }
  
  const serverBots = Object.entries(bots).filter(([_, b]) => b.serverId === serverId);
  
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${server.name} - Aternos Bot PRO</title>
      <style>
        ${getStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1>🖥️ ${server.name}</h1>
            <p style="color: #6b7280; margin-top: 5px;">${server.host}:${server.port} • ${server.version}</p>
          </div>
          <button onclick="window.location.href='/'" class="btn btn-secondary">← Geri Dön</button>
        </div>
        
        <div class="card" style="margin-bottom: 20px;">
          <h2>🎛️ Sunucu Kontrolü</h2>
          <form action="/api/add-bot/${serverId}" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-success" ${serverBots.length >= config.maxBotsPerServer ? 'disabled' : ''}>
              ➕ Yeni Bot Ekle (${serverBots.length}/${config.maxBotsPerServer})
            </button>
          </form>
          <form action="/api/stop-all-bots/${serverId}" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-danger">⏹️ Tüm Botları Durdur</button>
          </form>
          <form action="/api/restart-all-bots/${serverId}" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-warning">🔄 Tüm Botları Yeniden Başlat</button>
          </form>
        </div>
        
        <h2 style="color: white; margin-bottom: 15px;">🤖 Aktif Botlar</h2>
        
        ${serverBots.length === 0 ? `
          <div class="card">
            <p style="text-align: center; color: #6b7280; padding: 40px 0;">
              Bu sunucuda henüz bot yok. Yukarıdan "Yeni Bot Ekle" butonuna basın.
            </p>
          </div>
        ` : ''}
        
        <div class="grid">
          ${serverBots.map(([botId, botData]) => {
            const isOnline = botData.bot ? true : false;
            const isConnecting = botData.isConnecting;
            const stats = botData.stats;
            
            return `
              <div class="card bot-card ${isOnline ? 'online' : (isConnecting ? 'connecting' : 'offline')}">
                <div class="bot-header">
                  <div>
                    <span class="bot-status ${isOnline ? 'status-online' : (isConnecting ? 'status-connecting' : 'status-offline')}"></span>
                    <strong>${stats.username || 'Bot #' + botId.substr(-8)}</strong>
                  </div>
                  <form action="/api/remove-bot/${botId}" method="POST" style="display: inline;">
                    <button type="submit" class="btn btn-danger btn-small" onclick="return confirm('Botu silmek istediğinize emin misiniz?')">🗑️</button>
                  </form>
                </div>
                <div class="stat">
                  <span class="stat-label">Durum</span>
                  <span class="stat-value">${isOnline ? '🟢 Online' : (isConnecting ? '🟡 Bağlanıyor' : '🔴 Offline')}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Toplam Bağlantı</span>
                  <span class="stat-value">${stats.connections}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Başarılı Giriş</span>
                  <span class="stat-value">${stats.successes}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Hata Sayısı</span>
                  <span class="stat-value">${stats.errors}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Kick Sayısı</span>
                  <span class="stat-value">${stats.kicks}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <script>
        setTimeout(() => location.reload(), 5000);
      </script>
    </body>
    </html>
  `);
});

// Ayarlar Sayfası
app.get('/settings', requireAuth, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ayarlar - Aternos Bot PRO</title>
      <style>
        ${getStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚙️ Genel Ayarlar</h1>
        </div>
        
        <div class="tabs">
          <button class="tab" onclick="window.location.href='/'">🏠 Sunucular</button>
          <button class="tab active" onclick="window.location.href='/settings'">⚙️ Ayarlar</button>
          <button class="tab" onclick="window.location.href='/analytics'">📈 İstatistikler</button>
        </div>
        
        <div class="grid">
          <div class="card">
            <h2>⏱️ Zaman Ayarları</h2>
            <form action="/api/update-config" method="POST">
              <div class="form-group">
                <label>Min Kalma Süresi (saniye)</label>
                <input type="number" name="minStayTime" value="${config.minStayTime}" required>
              </div>
              <div class="form-group">
                <label>Max Kalma Süresi (saniye)</label>
                <input type="number" name="maxStayTime" value="${config.maxStayTime}" required>
              </div>
              <div class="form-group">
                <label>Min Bekleme Süresi (saniye)</label>
                <input type="number" name="minWaitTime" value="${config.minWaitTime}" required>
              </div>
              <div class="form-group">
                <label>Max Bekleme Süresi (saniye)</label>
                <input type="number" name="maxWaitTime" value="${config.maxWaitTime}" required>
              </div>
              <button type="submit" class="btn btn-primary">💾 Kaydet</button>
            </form>
          </div>
          
          <div class="card">
            <h2>🚀 Bot Ayarları</h2>
            <form action="/api/update-bot-config" method="POST">
              <div class="form-group">
                <label>Sunucu Başına Max Bot</label>
                <input type="number" name="maxBotsPerServer" value="${config.maxBotsPerServer}" min="1" max="20" required>
                <small style="color: #6b7280; display: block; margin-top: 5px;">
                  Önerilen: Aternos 1GB için 1-2, 2GB için 3-4 bot
                </small>
              </div>
              <div class="form-group checkbox-group">
                <input type="checkbox" name="enableMovement" ${config.enableMovement ? 'checked' : ''}>
                <label>Hareket Simülasyonu (RAM kullanımını artırır)</label>
              </div>
              <div class="form-group checkbox-group">
                <input type="checkbox" name="autoReconnect" ${config.autoReconnect ? 'checked' : ''}>
                <label>Otomatik Yeniden Bağlan</label>
              </div>
              <button type="submit" class="btn btn-primary">💾 Kaydet</button>
            </form>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// İstatistikler Sayfası
app.get('/analytics', requireAuth, (req, res) => {
  const totalBots = Object.keys(bots).length;
  const totalConnections = Object.values(bots).reduce((sum, b) => sum + b.stats.connections, 0);
  const totalSuccesses = Object.values(bots).reduce((sum, b) => sum + b.stats.successes, 0);
  const totalErrors = Object.values(bots).reduce((sum, b) => sum + b.stats.errors, 0);
  const successRate = totalConnections > 0 ? Math.round((totalSuccesses / totalConnections) * 100) : 0;
  
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>İstatistikler - Aternos Bot PRO</title>
      <style>
        ${getStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📈 İstatistikler</h1>
        </div>
        
        <div class="tabs">
          <button class="tab" onclick="window.location.href='/'">🏠 Sunucular</button>
          <button class="tab" onclick="window.location.href='/settings'">⚙️ Ayarlar</button>
          <button class="tab active" onclick="window.location.href='/analytics'">📈 İstatistikler</button>
        </div>
        
        <div class="grid">
          <div class="card">
            <h2>📊 Genel İstatistikler</h2>
            <div class="stat">
              <span class="stat-label">Toplam Sunucu</span>
              <span class="stat-value">${Object.keys(servers).length}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Toplam Bot</span>
              <span class="stat-value">${totalBots}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Toplam Bağlantı</span>
              <span class="stat-value">${totalConnections}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Başarılı Giriş</span>
              <span class="stat-value">${totalSuccesses}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Toplam Hata</span>
              <span class="stat-value">${totalErrors}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Başarı Oranı</span>
              <span class="stat-value">${successRate}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${successRate}%"></div>
            </div>
          </div>
          
          <div class="card">
            <h2>🖥️ Sunucu Bazlı İstatistikler</h2>
            ${Object.entries(servers).map(([serverId, server]) => {
              const serverBots = Object.values(bots).filter(b => b.serverId === serverId);
              const serverActive = serverBots.filter(b => b.bot).length;
              
              return `
                <div class="stat">
                  <span class="stat-label">${server.name}</span>
                  <span class="stat-value">${serverBots.length} bot (${serverActive} aktif)</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API Endpoints
app.post('/api/add-server', requireAuth, (req, res) => {
  const serverId = 'server_' + Date.now();
  servers[serverId] = {
    name: req.body.name,
    host: req.body.host,
    port: parseInt(req.body.port),
    version: req.body.version,
    bots: []
  };
  console.log('✅ Sunucu eklendi:', servers[serverId].name);
  res.redirect('/');
});

app.post('/api/remove-server/:serverId', requireAuth, (req, res) => {
  const serverId = req.params.serverId;
  
  // Sunucudaki tüm botları durdur
  Object.entries(bots).forEach(([botId, bot]) => {
    if (bot.serverId === serverId) {
      cleanupBot(botId);
      delete bots[botId];
    }
  });
  
  delete servers[serverId];
  console.log('🗑️ Sunucu silindi:', serverId);
  res.redirect('/');
});

app.post('/api/add-bot/:serverId', requireAuth, (req, res) => {
  const serverId = req.params.serverId;
  const server = servers[serverId];
  
  if (!server) {
    return res.redirect('/');
  }
  
  const serverBots = Object.values(bots).filter(b => b.serverId === serverId);
  
  if (serverBots.length >= config.maxBotsPerServer) {
    return res.redirect(`/server/${serverId}`);
  }
  
  createBotForServer(serverId);
  res.redirect(`/server/${serverId}`);
});

app.post('/api/remove-bot/:botId', requireAuth, (req, res) => {
  const botId = req.params.botId;
  const serverId = bots[botId] ? bots[botId].serverId : null;
  
  cleanupBot(botId);
  delete bots[botId];
  
  console.log('🗑️ Bot silindi:', botId);
  
  if (serverId) {
    res.redirect(`/server/${serverId}`);
  } else {
    res.redirect('/');
  }
});

app.post('/api/stop-all-bots/:serverId', requireAuth, (req, res) => {
  const serverId = req.params.serverId;
  
  Object.entries(bots).forEach(([botId, bot]) => {
    if (bot.serverId === serverId) {
      cleanupBot(botId);
    }
  });
  
  res.redirect(`/server/${serverId}`);
});

app.post('/api/restart-all-bots/:serverId', requireAuth, (req, res) => {
  const serverId = req.params.serverId;
  const serverBots = Object.entries(bots).filter(([_, b]) => b.serverId === serverId);
  
  serverBots.forEach(([botId]) => {
    cleanupBot(botId);
    setTimeout(() => connectBot(botId), 2000);
  });
  
  res.redirect(`/server/${serverId}`);
});

app.post('/api/update-config', requireAuth, (req, res) => {
  config.minStayTime = parseInt(req.body.minStayTime);
  config.maxStayTime = parseInt(req.body.maxStayTime);
  config.minWaitTime = parseInt(req.body.minWaitTime);
  config.maxWaitTime = parseInt(req.body.maxWaitTime);
  console.log('⚙️ Zaman ayarları güncellendi');
  res.redirect('/settings');
});

app.post('/api/update-bot-config', requireAuth, (req, res) => {
  config.maxBotsPerServer = parseInt(req.body.maxBotsPerServer);
  config.enableMovement = req.body.enableMovement === 'on';
  config.autoReconnect = req.body.autoReconnect === 'on';
  console.log('⚙️ Bot ayarları güncellendi');
  res.redirect('/settings');
});

app.listen(PORT, () => {
  console.log('🌐 Dashboard: http://localhost:' + PORT);
  console.log('👤 Kullanıcı:', ADMIN.username);
  console.log('🔑 Şifre:', ADMIN.password);
  console.log('⚠️ ÖNEMLİ: Şifreyi değiştir!');
});

// Bot Fonksiyonları
function getRandomUsername() {
  const prefixes = ['Dark','Shadow','Fire','Ice','Thunder','Storm','Night','Blood','Soul','Ghost','Dragon','Wolf','Tiger','Lion','Eagle','Hawk','Raven','Phoenix','Demon','Angel','King','Queen','Lord','Master','Legend','Epic','Super','Ultra','Mega','Hyper','Pro','Ace','Elite','Prime','Alpha','Beta','Omega','Nova','Star','Sky','Moon','Sun','Light','Void','Frost','Flame','Aqua','Terra','Aero','Metal'];
  const suffixes = ['Slayer','Killer','Hunter','Destroyer','Breaker','Crusher','Reaper','Striker','Warrior','Knight','Guardian','Champion','Hero','Legend','Master','Lord','King','Dragon','Wolf','Tiger','Bear','Eagle','Blade','Sword','Rider','Walker','Runner','Miner','Builder','Crafter','Gamer','Player'];
  const styles = [
    () => prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)] + Math.floor(Math.random() * 9999),
    () => prefixes[Math.floor(Math.random() * prefixes.length)] + Math.floor(Math.random() * 999) + suffixes[Math.floor(Math.random() * suffixes.length)],
    () => 'xX_' + prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)] + '_Xx'
  ];
  let u = styles[Math.floor(Math.random() * styles.length)]();
  return u.length > 16 ? u.substring(0, 16) : u;
}

function humanizeBot(botId) {
  if (!bots[botId] || !bots[botId].bot || !config.enableMovement) return;
  const bot = bots[botId].bot;
  
  try {
    const yaw = (Math.random() - 0.5) * 0.5;
    const pitch = (Math.random() - 0.5) * 0.2;
    bot.look(bot.entity.yaw + yaw, bot.entity.pitch + pitch, true);
    
    if (Math.random() < 0.1) {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 300);
    }
    
    const dirs = ['forward', 'back', 'left', 'right'];
    if (Math.random() < 0.2) {
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      bot.setControlState(dir, true);
      setTimeout(() => bot.setControlState(dir, false), 1000 + Math.random() * 2000);
    }
    
    setTimeout(() => humanizeBot(botId), 2000 + Math.random() * 3000);
  } catch (e) {}
}

function createBotForServer(serverId) {
  const server = servers[serverId];
  if (!server) return;
  
  const botId = 'bot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  bots[botId] = {
    bot: null,
    isConnecting: false,
    serverId: serverId,
    stats: {
      username: null,
      connections: 0,
      successes: 0,
      errors: 0,
      kicks: 0
    }
  };
  
  connectBot(botId);
}

function connectBot(botId) {
  if (!bots[botId] || bots[botId].bot || bots[botId].isConnecting) return;
  
  const server = servers[bots[botId].serverId];
  if (!server) return;
  
  bots[botId].isConnecting = true;
  bots[botId].stats.connections++;
  
  const username = getRandomUsername();
  bots[botId].stats.username = username;
  
  console.log(`🤖 [${botId.substr(-8)}] Bağlanıyor:`, username, '→', server.name);
  
  try {
    const bot = mineflayer.createBot({
      host: server.host,
      port: server.port,
      username,
      version: server.version,
      auth: 'offline',
      hideErrors: true,
      checkTimeoutInterval: 60000,
      keepAlive: true,
      viewDistance: 'tiny',
      connectTimeout: 120000
    });
    
    bots[botId].bot = bot;
    
    const timeout = setTimeout(() => {
      console.log(`⏱️ [${botId.substr(-8)}] Timeout`);
      bots[botId].stats.errors++;
      reconnectBot(botId);
    }, 120000);
    
    bot.once('login', () => {
      clearTimeout(timeout);
      bots[botId].isConnecting = false;
      bots[botId].stats.successes++;
      console.log(`✅ [${botId.substr(-8)}] Giriş:`, username);
      
      const stay = config.minStayTime * 1000 + Math.random() * (config.maxStayTime - config.minStayTime) * 1000;
      
      if (config.enableMovement) humanizeBot(botId);
      
      setTimeout(() => {
        console.log(`👋 [${botId.substr(-8)}] Çıkış`);
        if (bots[botId] && bots[botId].bot) {
          try { bot.end(); } catch {}
        }
      }, stay);
    });
    
    bot.on('end', () => {
      clearTimeout(timeout);
      console.log(`❌ [${botId.substr(-8)}] Bağlantı kesildi`);
      reconnectBot(botId);
    });
    
    bot.on('kicked', (reason) => {
      clearTimeout(timeout);
      bots[botId].stats.kicks++;
      console.log(`⚠️ [${botId.substr(-8)}] Kick:`, reason);
      reconnectBot(botId);
    });
    
    bot.on('error', (err) => {
      clearTimeout(timeout);
      bots[botId].stats.errors++;
      console.log(`⚠️ [${botId.substr(-8)}] Hata:`, err.code || err.message);
      reconnectBot(botId);
    });
    
  } catch (err) {
    bots[botId].stats.errors++;
    console.log(`⚠️ [${botId.substr(-8)}] Bot hatası:`, err.message);
    reconnectBot(botId);
  }
}

function reconnectBot(botId) {
  if (!bots[botId]) return;
  
  cleanupBot(botId);
  
  if (config.autoReconnect) {
    const wait = config.minWaitTime * 1000 + Math.random() * (config.maxWaitTime - config.minWaitTime) * 1000;
    setTimeout(() => {
      if (bots[botId]) connectBot(botId);
    }, wait);
  }
}

function cleanupBot(botId) {
  if (!bots[botId]) return;
  
  bots[botId].isConnecting = false;
  if (bots[botId].bot) {
    try {
      bots[botId].bot.removeAllListeners();
      bots[botId].bot.end();
    } catch {}
    bots[botId].bot = null;
  }
}

function getStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
    .header h1 { color: #667eea; font-size: 28px; }
    .header-stats { display: flex; gap: 15px; flex-wrap: wrap; align-items: center; }
    .stat-badge { padding: 10px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; }
    .badge-primary { background: #667eea; color: white; }
    .badge-success { background: #10b981; color: white; }
    .badge-warning { background: #f59e0b; color: white; }
    .badge-danger { background: #ef4444; color: white; }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .tab { padding: 12px 25px; background: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transition: all 0.3s; }
    .tab:hover { transform: translateY(-2px); }
    .tab.active { background: #667eea; color: white; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .card h2 { color: #667eea; margin-bottom: 15px; font-size: 20px; }
    .add-server-card { border: 2px dashed #667eea; }
    .server-card { position: relative; }
    .server-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
    .server-info { color: #6b7280; font-size: 14px; margin-top: 5px; }
    .bot-counter { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; display: flex; justify-content: space-between; align-items: center; }
    .bot-count { font-weight: bold; font-size: 18px; color: #667eea; }
    .bot-count-full { color: #ef4444; }
    .bot-status-mini { display: flex; gap: 10px; align-items: center; font-size: 14px; }
    .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
    .status-online { background: #10b981; }
    .status-connecting { background: #f59e0b; }
    .status-offline { background: #ef4444; }
    .bot-actions { display: flex; gap: 10px; margin-top: 15px; }
    .bot-mini-list { margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
    .bot-mini-item { padding: 8px 0; display: flex; align-items: center; gap: 10px; font-size: 14px; color: #374151; }
    .bot-card { border-left: 4px solid #e5e7eb; }
    .bot-card.online { border-left-color: #10b981; }
    .bot-card.connecting { border-left-color: #f59e0b; }
    .bot-card.offline { border-left-color: #ef4444; }
    .bot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .bot-status { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; color: #374151; font-weight: 600; }
    .form-group input, .form-group select { width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #667eea; }
    .checkbox-group { display: flex; align-items: center; gap: 10px; }
    .checkbox-group input[type="checkbox"] { width: auto; }
    .btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.3s; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
    .btn-primary { background: #667eea; color: white; }
    .btn-success { background: #10b981; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-warning { background: #f59e0b; color: white; }
    .btn-secondary { background: #6b7280; color: white; }
    .btn-small { padding: 6px 12px; font-size: 12px; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .stat { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .stat:last-child { border-bottom: none; }
    .stat-label { color: #6b7280; font-weight: 500; }
    .stat-value { color: #111827; font-weight: bold; }
    .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 10px; overflow: hidden; margin-top: 10px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s; }
    .alert { padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .alert-info { background: #dbeafe; color: #1e40af; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } .header { flex-direction: column; align-items: flex-start; } }
  `;
}

console.log('🚀 Aternos Bot PRO - Admin Panel');
console.log('================================');

process.on('SIGINT', () => {
  console.log('\n⛔ Kapatılıyor...');
  Object.keys(bots).forEach(cleanupBot);
  process.exit();
});

process.on('uncaughtException', (err) => {
  console.log('⚠️ Hata:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.log('⚠️ Promise:', err.message);
});
