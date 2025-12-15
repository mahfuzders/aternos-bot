const mineflayer = require('mineflayer');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multi-bot yönetimi
let bots = {}; // { botId: { bot, config, stats, isConnecting } }
let globalStats = {
  totalBots: 0,
  activeBots: 0,
  totalConnections: 0,
  totalErrors: 0,
  startTime: Date.now()
};

// Varsayılan sunucu listesi
let servers = [
  {
    id: 'server1',
    name: 'Ana Sunucu',
    host: 'iamsofiathefirsttt.aternos.me',
    port: 25565,
    version: '1.20.4',
    enabled: true
  }
];

// Bot konfigürasyonu
const defaultConfig = {
  minStayTime: 60,
  maxStayTime: 120,
  minWaitTime: 30,
  maxWaitTime: 90,
  enableMovement: true,
  autoReconnect: true,
  maxConcurrentBots: 3 // Aynı anda max bot sayısı
};

let config = { ...defaultConfig };

// Ana Dashboard
app.get('/', (req, res) => {
  const uptime = Math.floor((Date.now() - globalStats.startTime) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  const activeBots = Object.values(bots).filter(b => b.bot).length;
  const connectingBots = Object.values(bots).filter(b => b.isConnecting).length;

  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Aternos Bot PRO - Multi-Bot Manager</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        
        .header {
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        .header h1 { color: #667eea; font-size: 28px; }
        .header-stats {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .stat-badge {
          padding: 10px 20px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
        }
        .badge-primary { background: #667eea; color: white; }
        .badge-success { background: #10b981; color: white; }
        .badge-warning { background: #f59e0b; color: white; }
        .badge-danger { background: #ef4444; color: white; }
        
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .tab {
          padding: 12px 25px;
          background: white;
          border: none;
          border-radius: 10px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          transition: all 0.3s;
        }
        .tab:hover { transform: translateY(-2px); }
        .tab.active { background: #667eea; color: white; }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
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
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .bot-card {
          border-left: 4px solid #667eea;
          position: relative;
        }
        .bot-card.online { border-left-color: #10b981; }
        .bot-card.connecting { border-left-color: #f59e0b; }
        .bot-card.offline { border-left-color: #ef4444; }
        
        .bot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .bot-status {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
        }
        .status-online { background: #10b981; }
        .status-connecting { background: #f59e0b; }
        .status-offline { background: #ef4444; }
        
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
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          margin-right: 8px;
          margin-bottom: 8px;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .btn-primary { background: #667eea; color: white; }
        .btn-success { background: #10b981; color: white; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-warning { background: #f59e0b; color: white; }
        .btn-secondary { background: #6b7280; color: white; }
        .btn-small { padding: 6px 12px; font-size: 12px; }
        
        .server-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .server-item {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .server-info h3 { color: #374151; margin-bottom: 5px; }
        .server-info p { color: #6b7280; font-size: 13px; }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 10px;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s;
        }
        
        .alert {
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .alert-info { background: #dbeafe; color: #1e40af; }
        .alert-warning { background: #fef3c7; color: #92400e; }
        .alert-success { background: #d1fae5; color: #065f46; }
        
        @media (max-width: 768px) {
          .grid { grid-template-columns: 1fr; }
          .header { flex-direction: column; align-items: flex-start; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1>🤖 Aternos Bot PRO</h1>
            <p style="color: #6b7280; margin-top: 5px;">Uptime: ${hours}s ${minutes}d ${seconds}sn</p>
          </div>
          <div class="header-stats">
            <span class="stat-badge badge-primary">📊 Toplam: ${globalStats.totalBots}</span>
            <span class="stat-badge badge-success">🟢 Aktif: ${activeBots}</span>
            <span class="stat-badge badge-warning">🟡 Bağlanıyor: ${connectingBots}</span>
            <span class="stat-badge badge-danger">🔴 Offline: ${globalStats.totalBots - activeBots - connectingBots}</span>
          </div>
        </div>
        
        <div class="alert alert-info">
          💡 <strong>Pro İpucu:</strong> RAM optimizasyonu için max ${config.maxConcurrentBots} bot çalışıyor. 
          Mevcut RAM: ~${Math.round((activeBots * 100 + 50))} MB
        </div>
        
        <div class="tabs">
          <button class="tab active" onclick="window.location.href='/'">🏠 Dashboard</button>
          <button class="tab" onclick="window.location.href='/servers'">🖥️ Sunucular</button>
          <button class="tab" onclick="window.location.href='/settings'">⚙️ Ayarlar</button>
          <button class="tab" onclick="window.location.href='/analytics'">📈 Analitik</button>
        </div>
        
        <div class="card" style="margin-bottom: 20px;">
          <h2>🎛️ Hızlı Kontrol</h2>
          <form action="/api/start-all" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-success">▶️ Tümünü Başlat</button>
          </form>
          <form action="/api/stop-all" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-danger">⏹️ Tümünü Durdur</button>
          </form>
          <form action="/api/restart-all" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-warning">🔄 Tümünü Yeniden Başlat</button>
          </form>
          <form action="/api/add-bot" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-primary" ${activeBots >= config.maxConcurrentBots ? 'disabled' : ''}>
              ➕ Yeni Bot Ekle (${activeBots}/${config.maxConcurrentBots})
            </button>
          </form>
        </div>
        
        <h2 style="color: white; margin-bottom: 15px; font-size: 24px;">🤖 Aktif Botlar</h2>
        
        ${Object.keys(bots).length === 0 ? `
          <div class="card">
            <p style="text-align: center; color: #6b7280; padding: 40px 0;">
              Bot yok. Yukarıdan "Yeni Bot Ekle" butonuna basın.
            </p>
          </div>
        ` : ''}
        
        <div class="grid">
          ${Object.entries(bots).map(([botId, botData]) => {
            const isOnline = botData.bot ? true : false;
            const isConnecting = botData.isConnecting;
            const stats = botData.stats;
            
            return `
              <div class="card bot-card ${isOnline ? 'online' : (isConnecting ? 'connecting' : 'offline')}">
                <div class="bot-header">
                  <div>
                    <span class="bot-status ${isOnline ? 'status-online' : (isConnecting ? 'status-connecting' : 'status-offline')}"></span>
                    <strong>${stats.username || 'Bot #' + botId}</strong>
                  </div>
                  <div>
                    <form action="/api/remove-bot/${botId}" method="POST" style="display: inline;">
                      <button type="submit" class="btn btn-danger btn-small">🗑️</button>
                    </form>
                  </div>
                </div>
                <div class="stat">
                  <span class="stat-label">Sunucu</span>
                  <span class="stat-value">${botData.config.serverName}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Host</span>
                  <span class="stat-value">${botData.config.host}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Durum</span>
                  <span class="stat-value">${isOnline ? '🟢 Online' : (isConnecting ? '🟡 Bağlanıyor' : '🔴 Offline')}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Bağlantı</span>
                  <span class="stat-value">${stats.connections}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Başarılı</span>
                  <span class="stat-value">${stats.successes}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Hata</span>
                  <span class="stat-value">${stats.errors}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
      </div>
      
      <script>
        // Otomatik yenileme
        setTimeout(() => location.reload(), 5000);
      </script>
    </body>
    </html>
  `);
});

// Sunucular Sayfası
app.get('/servers', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sunucular - Aternos Bot PRO</title>
      <style>
        ${getCommonStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🖥️ Sunucu Yönetimi</h1>
        </div>
        
        <div class="tabs">
          <button class="tab" onclick="window.location.href='/'">🏠 Dashboard</button>
          <button class="tab active" onclick="window.location.href='/servers'">🖥️ Sunucular</button>
          <button class="tab" onclick="window.location.href='/settings'">⚙️ Ayarlar</button>
          <button class="tab" onclick="window.location.href='/analytics'">📈 Analitik</button>
        </div>
        
        <div class="grid">
          <div class="card">
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
          
          <div class="card">
            <h2>📋 Kayıtlı Sunucular</h2>
            <div class="server-list">
              ${servers.map((server, i) => `
                <div class="server-item">
                  <div class="server-info">
                    <h3>${server.name}</h3>
                    <p>${server.host}:${server.port} • ${server.version}</p>
                  </div>
                  <form action="/api/remove-server/${i}" method="POST" style="display: inline;">
                    <button type="submit" class="btn btn-danger btn-small">🗑️ Sil</button>
                  </form>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Ayarlar Sayfası
app.get('/settings', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ayarlar - Aternos Bot PRO</title>
      <style>
        ${getCommonStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚙️ Genel Ayarlar</h1>
        </div>
        
        <div class="tabs">
          <button class="tab" onclick="window.location.href='/'">🏠 Dashboard</button>
          <button class="tab" onclick="window.location.href='/servers'">🖥️ Sunucular</button>
          <button class="tab active" onclick="window.location.href='/settings'">⚙️ Ayarlar</button>
          <button class="tab" onclick="window.location.href='/analytics'">📈 Analitik</button>
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
            <h2>🚀 Performans Ayarları</h2>
            <form action="/api/update-performance" method="POST">
              <div class="form-group">
                <label>Max Eşzamanlı Bot Sayısı</label>
                <input type="number" name="maxConcurrentBots" value="${config.maxConcurrentBots}" min="1" max="10" required>
                <small style="color: #6b7280; display: block; margin-top: 5px;">
                  Tahmini RAM: ~${config.maxConcurrentBots * 100 + 50} MB
                </small>
              </div>
              <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" name="enableMovement" ${config.enableMovement ? 'checked' : ''}>
                <label style="margin: 0;">Hareket Simülasyonu</label>
              </div>
              <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" name="autoReconnect" ${config.autoReconnect ? 'checked' : ''}>
                <label style="margin: 0;">Otomatik Yeniden Bağlan</label>
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

// Analitik Sayfası
app.get('/analytics', (req, res) => {
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
      <title>Analitik - Aternos Bot PRO</title>
      <style>
        ${getCommonStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📈 Analitik & İstatistikler</h1>
        </div>
        
        <div class="tabs">
          <button class="tab" onclick="window.location.href='/'">🏠 Dashboard</button>
          <button class="tab" onclick="window.location.href='/servers'">🖥️ Sunucular</button>
          <button class="tab" onclick="window.location.href='/settings'">⚙️ Ayarlar</button>
          <button class="tab active" onclick="window.location.href='/analytics'">📈 Analitik</button>
        </div>
        
        <div class="grid">
          <div class="card">
            <h2>📊 Genel İstatistikler</h2>
            <div class="stat">
              <span class="stat-label">Toplam Bot</span>
              <span class="stat-value">${Object.keys(bots).length}</span>
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
            <h2>💾 Sistem Bilgileri</h2>
            <div class="stat">
              <span class="stat-label">Node.js Versiyonu</span>
              <span class="stat-value">${process.version}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Platform</span>
              <span class="stat-value">${process.platform}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Tahmini RAM</span>
              <span class="stat-value">~${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB</span>
            </div>
            <div class="stat">
              <span class="stat-label">Uptime</span>
              <span class="stat-value">${Math.floor(process.uptime() / 60)} dakika</span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API Endpoints
app.post('/api/start-all', (req, res) => {
  servers.filter(s => s.enabled).forEach((server, i) => {
    if (Object.keys(bots).length < config.maxConcurrentBots) {
      createBotForServer(server);
    }
  });
  res.redirect('/');
});

app.post('/api/stop-all', (req, res) => {
  Object.keys(bots).forEach(botId => {
    cleanupBot(botId);
  });
  res.redirect('/');
});

app.post('/api/restart-all', (req, res) => {
  Object.keys(bots).forEach(botId => {
    cleanupBot(botId);
  });
  setTimeout(() => {
    servers.filter(s => s.enabled).forEach((server, i) => {
      if (Object.keys(bots).length < config.maxConcurrentBots) {
        createBotForServer(server);
      }
    });
  }, 2000);
  res.redirect('/');
});

app.post('/api/add-bot', (req, res) => {
  if (Object.keys(bots).length < config.maxConcurrentBots && servers.length > 0) {
    const randomServer = servers[Math.floor(Math.random() * servers.length)];
    createBotForServer(randomServer);
  }
  res.redirect('/');
});

app.post('/api/remove-bot/:botId', (req, res) => {
  cleanupBot(req.params.botId);
  delete bots[req.params.botId];
  globalStats.totalBots--;
  res.redirect('/');
});

app.post('/api/add-server', (req, res) => {
  servers.push({
    id: 'server' + Date.now(),
    name: req.body.name,
    host: req.body.host,
    port: parseInt(req.body.port),
    version: req.body.version,
    enabled: true
  });
  res.redirect('/servers');
});

app.post('/api/remove-server/:index', (req, res) => {
  servers.splice(parseInt(req.params.index), 1);
  res.redirect('/servers');
});

app.post('/api/update-config', (req, res) => {
  config.minStayTime = parseInt(req.body.minStayTime);
  config.maxStayTime = parseInt(req.body.maxStayTime);
  config.minWaitTime = parseInt(req.body.minWaitTime);
  config.maxWaitTime = parseInt(req.body.maxWaitTime);
  res.redirect('/settings');
});

app.post('/api/update-performance', (req, res) => {
  config.maxConcurrentBots = parseInt(req.body.maxConcurrentBots);
  config.enableMovement = req.body.enableMovement === 'on';
  config.autoReconnect = req.body.autoReconnect === 'on';
  res.redirect('/settings');
});

app.get('/api/status', (req, res) => {
  res.json({
    bots: Object.keys(bots).map(id => ({
      id,
      online: bots[id].bot ? true : false,
      connecting: bots[id].isConnecting,
      stats: bots[id].stats
    })),
    globalStats,
    config,
    servers
  });
});

app.listen(PORT, () => {
  console.log('🌐 Dashboard: http://localhost:' + PORT);
  console.log('🚀 Aternos Bot PRO başlatıldı');
});

// Bot Yönetim Fonksiyonları
function getRandomUsername() {
  const prefixes = ['Dark','Shadow','Fire','Ice','Thunder','Storm','Night','Blood','Soul','Ghost','Dragon','Wolf','Tiger','Lion','Eagle','Hawk','Raven','Phoenix','Demon','Angel','King','Queen','Lord','Master','Legend','Epic','Super','Ultra','Mega','Hyper','Pro','Ace','Elite','Prime','Alpha','Beta','Omega','Nova','Star','Sky','Moon','Sun','Light','Void','Frost','Flame','Aqua','Terra','Aero','Metal'];
  const suffixes = ['Slayer','Killer','Hunter','Destroyer','Breaker','Crusher','Reaper','Striker','Warrior','Knight','Guardian','Champion','Hero','Legend','Master','Lord','King','Dragon','Wolf','Tiger','Bear','Eagle','Blade','Sword','Rider','Walker','Runner','Miner','Builder','Crafter','Gamer','Player'];
  const styles = [
    () => prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)] + Math.floor(Math.random() * 9999),
    () => prefixes[Math.floor(Math.random() * prefixes.length)] + Math.floor(Math.random() * 999) + suffixes[Math.floor(Math.random() * suffixes.length)],
    () => 'xX_' + prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)] + '_Xx',
    () => prefixes[Math.floor(Math.random() * prefixes.length)] + '_' + suffixes[Math.floor(Math.random() * suffixes.length)] + '_' + Math.floor(Math.random() * 999)
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
    
    if (Math.random() < 0.1) {
      Object.keys(bot.controlState).forEach(k => bot.setControlState(k, false));
    }
    
    setTimeout(() => humanizeBot(botId), 2000 + Math.random() * 3000);
  } catch (e) {}
}

function createBotForServer(server) {
  const botId = 'bot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  bots[botId] = {
    bot: null,
    isConnecting: false,
    config: {
      serverName: server.name,
      host: server.host,
      port: server.port,
      version: server.version
    },
    stats: {
      username: null,
      connections: 0,
      successes: 0,
      errors: 0,
      kicks: 0
    }
  };
  
  globalStats.totalBots++;
  connectBot(botId);
}

function connectBot(botId) {
  if (!bots[botId] || bots[botId].bot || bots[botId].isConnecting) return;
  
  bots[botId].isConnecting = true;
  bots[botId].stats.connections++;
  globalStats.totalConnections++;
  
  const username = getRandomUsername();
  bots[botId].stats.username = username;
  
  console.log(`🤖 [${botId}] Bağlanıyor:`, username);
  
  try {
    const bot = mineflayer.createBot({
      host: bots[botId].config.host,
      port: bots[botId].config.port,
      username,
      version: bots[botId].config.version,
      auth: 'offline',
      hideErrors: false,
      checkTimeoutInterval: 30000,
      keepAlive: true,
      viewDistance: 'tiny' // RAM optimizasyonu
    });
    
    bots[botId].bot = bot;
    
    const timeout = setTimeout(() => {
      console.log(`⏱️ [${botId}] Timeout`);
      bots[botId].stats.errors++;
      globalStats.totalErrors++;
      reconnectBot(botId);
    }, 60000);
    
    bot.once('login', () => {
      clearTimeout(timeout);
      bots[botId].isConnecting = false;
      bots[botId].stats.successes++;
      console.log(`✅ [${botId}] Giriş:`, username);
      
      const stay = config.minStayTime * 1000 + Math.random() * (config.maxStayTime - config.minStayTime) * 1000;
      
      if (config.enableMovement) humanizeBot(botId);
      
      setTimeout(() => {
        console.log(`👋 [${botId}] Çıkış`);
        if (bots[botId] && bots[botId].bot) {
          try { bot.end(); } catch {}
        }
      }, stay);
    });
    
    bot.on('end', () => {
      clearTimeout(timeout);
      console.log(`❌ [${botId}] Kesildi`);
      reconnectBot(botId);
    });
    
    bot.on('kicked', (reason) => {
      clearTimeout(timeout);
      bots[botId].stats.kicks++;
      console.log(`⚠️ [${botId}] Kick:`, reason);
      reconnectBot(botId);
    });
    
    bot.on('error', (err) => {
      clearTimeout(timeout);
      bots[botId].stats.errors++;
      globalStats.totalErrors++;
      console.log(`⚠️ [${botId}] Hata:`, err.code || err.message);
      reconnectBot(botId);
    });
    
  } catch (err) {
    bots[botId].stats.errors++;
    console.log(`⚠️ [${botId}] Bot hatası:`, err.message);
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

function getCommonStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin-bottom: 20px; }
    .header h1 { color: #667eea; }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .tab { padding: 12px 25px; background: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transition: all 0.3s; }
    .tab:hover { transform: translateY(-2px); }
    .tab.active { background: #667eea; color: white; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .card h2 { color: #667eea; margin-bottom: 15px; font-size: 20px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; color: #374151; font-weight: 600; }
    .form-group input, .form-group select { width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; }
    .btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.3s; margin-right: 8px; margin-bottom: 8px; }
    .btn-primary { background: #667eea; color: white; }
    .btn-success { background: #10b981; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-small { padding: 6px 12px; font-size: 12px; }
    .stat { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .stat:last-child { border-bottom: none; }
    .stat-label { color: #6b7280; font-weight: 500; }
    .stat-value { color: #111827; font-weight: bold; }
    .server-list { display: flex; flex-direction: column; gap: 10px; }
    .server-item { background: #f9fafb; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .server-info h3 { color: #374151; margin-bottom: 5px; }
    .server-info p { color: #6b7280; font-size: 13px; }
    .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 10px; overflow: hidden; margin-top: 10px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s; }
  `;
}

console.log('🚀 Aternos Bot PRO başlatılıyor...');
console.log('🌐 Dashboard: http://localhost:' + PORT);

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
