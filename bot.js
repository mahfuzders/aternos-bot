const mineflayer = require('mineflayer');
const express = require('express');

const app = express();
const PORT = 10000;

let totalAttempts = 0;
let successfulLogins = 0;
let failedAttempts = 0;
let lastSuccessTime = null;

app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Aternos Bot Status</title>
      <meta http-equiv="refresh" content="10">
      <style>
        body { font-family: monospace; background: #1a1a1a; color: #00ff00; padding: 20px; }
        .stat { margin: 10px 0; font-size: 18px; }
        .success { color: #00ff00; }
        .fail { color: #ff0000; }
        .info { color: #00aaff; }
      </style>
    </head>
    <body>
      <h1>🤖 Aternos Bot Status</h1>
      <div class="stat info">Total Attempts: ${totalAttempts}</div>
      <div class="stat success">Successful Logins: ${successfulLogins}</div>
      <div class="stat fail">Failed Attempts: ${failedAttempts}</div>
      <div class="stat">Bot Active: ${botActive ? 'YES' : 'NO'}</div>
      <div class="stat">Last Success: ${lastSuccessTime || 'Never'}</div>
      <div class="stat info">Current Time: ${new Date().toLocaleString()}</div>
      <hr>
      <p>Page auto-refreshes every 10 seconds</p>
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  console.log('✅ Web server started on port ' + PORT);
});

const SERVER_HOST = 'iamsofiathefirsttt.aternos.me';
const SERVER_PORT = 25565;

let botActive = false;
let currentBot = null;
let reconnectTimer = null;

function generateUsername() {
  const prefixes = ['Player', 'User', 'Guest', 'Steve', 'Alex', 'Miner', 'Gamer'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 9000) + 1000;
  return prefix + number;
}

function logWithTime(message) {
  const timestamp = new Date().toLocaleTimeString('tr-TR');
  console.log('[' + timestamp + '] ' + message);
}

function createBot() {
  if (botActive && currentBot) {
    logWithTime('⚠️  Bot already active, skipping...');
    return;
  }

  clearTimeout(reconnectTimer);
  totalAttempts++;
  
  const username = generateUsername();
  
  console.log('\n' + '='.repeat(60));
  logWithTime('🚀 STARTING NEW BOT');
  console.log('='.repeat(60));
  logWithTime('Username: ' + username);
  logWithTime('Server: ' + SERVER_HOST + ':' + SERVER_PORT);
  logWithTime('Attempt #' + totalAttempts);
  logWithTime('Success Rate: ' + successfulLogins + '/' + totalAttempts);
  console.log('='.repeat(60) + '\n');
  
  botActive = true;

  try {
    currentBot = mineflayer.createBot({
      host: SERVER_HOST,
      port: SERVER_PORT,
      username: username,
      version: '1.19.2',
      auth: 'offline',
      hideErrors: false,
      checkTimeoutInterval: 120 * 1000,
      connectTimeout: 120 * 1000,
      keepAlive: true,
      respawn: false,
      viewDistance: 'tiny',
      difficulty: 0
    });

    let hasLoggedIn = false;
    let stayDuration = 90000;
    let stayTimer = null;

    const loginTimeout = setTimeout(() => {
      if (!hasLoggedIn) {
        logWithTime('❌ 2 minute timeout - Connection failed');
        failedAttempts++;
        cleanup();
      }
    }, 120000);

    function cleanup() {
      clearTimeout(loginTimeout);
      clearTimeout(stayTimer);
      botActive = false;
      
      if (currentBot) {
        try {
          currentBot.removeAllListeners();
          currentBot.quit();
        } catch (e) {
          logWithTime('Cleanup error: ' + e.message);
        }
        currentBot = null;
      }
      
      scheduleReconnect();
    }

    currentBot.on('login', () => {
      clearTimeout(loginTimeout);
      hasLoggedIn = true;
      successfulLogins++;
      lastSuccessTime = new Date().toLocaleString('tr-TR');
      
      console.log('\n' + '★'.repeat(60));
      logWithTime('✅ LOGIN SUCCESSFUL!');
      console.log('★'.repeat(60));
      logWithTime('👤 Bot: ' + username);
      logWithTime('📊 Total Success: ' + successfulLogins);
      logWithTime('⏱️  Will stay for 90 seconds');
      console.log('★'.repeat(60) + '\n');
      
      stayTimer = setTimeout(() => {
        logWithTime('⏰ 90 seconds elapsed, disconnecting...');
        cleanup();
      }, stayDuration);
    });

    currentBot.on('spawn', () => {
      logWithTime('🎮 Bot spawned in world');
      try {
        const pos = currentBot.entity.position;
        logWithTime('📍 Position: X=' + Math.floor(pos.x) + ' Y=' + Math.floor(pos.y) + ' Z=' + Math.floor(pos.z));
      } catch (e) {
        logWithTime('Position info unavailable');
      }
    });

    currentBot.on('health', () => {
      if (currentBot && currentBot.health !== undefined) {
        logWithTime('❤️  Health: ' + currentBot.health);
      }
    });

    currentBot.on('chat', (username, message) => {
      logWithTime('💬 <' + username + '> ' + message);
    });

    currentBot.on('whisper', (username, message) => {
      logWithTime('📨 [' + username + ' whispers] ' + message);
    });

    currentBot.on('kicked', (reason) => {
      logWithTime('👢 KICKED: ' + reason);
      failedAttempts++;
      cleanup();
    });

    currentBot.on('error', (err) => {
      logWithTime('❌ ERROR: ' + err.message);
      
      if (err.message.includes('ETIMEDOUT')) {
        logWithTime('⚠️  Connection timeout - Server not responding');
        logWithTime('💡 This usually means:');
        logWithTime('   - Server is offline');
        logWithTime('   - Server is rate limiting connections');
        logWithTime('   - Network issue between Render and Aternos');
      } else if (err.message.includes('ECONNREFUSED')) {
        logWithTime('⚠️  Connection refused - Server is likely offline');
      } else if (err.message.includes('ENOTFOUND')) {
        logWithTime('⚠️  Server not found - Check hostname');
      }
      
      failedAttempts++;
      cleanup();
    });

    currentBot.on('end', (reason) => {
      logWithTime('🔌 Connection ended' + (reason ? ': ' + reason : ''));
      cleanup();
    });

    currentBot.on('messagestr', (message) => {
      if (message.includes('ban') || message.includes('kick')) {
        logWithTime('⚠️  WARNING: ' + message);
      }
    });

  } catch (err) {
    logWithTime('💥 Bot creation failed: ' + err.message);
    failedAttempts++;
    botActive = false;
    currentBot = null;
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  const waitTime = 180000;
  const waitMinutes = waitTime / 60000;
  
  logWithTime('⏳ Scheduling reconnect in ' + waitMinutes + ' minutes...');
  
  reconnectTimer = setTimeout(() => {
    if (!botActive) {
      logWithTime('🔄 Reconnect time! Starting new bot...');
      createBot();
    } else {
      logWithTime('⚠️  Bot still active, skipping scheduled reconnect');
    }
  }, waitTime);
}

console.log('\n' + '█'.repeat(60));
console.log('█' + ' '.repeat(58) + '█');
console.log('█' + '     ATERNOS MINECRAFT BOT - ADVANCED VERSION        ' + '█');
console.log('█' + ' '.repeat(58) + '█');
console.log('█'.repeat(60));
console.log('\n📋 Configuration:');
console.log('   Server: ' + SERVER_HOST);
console.log('   Port: ' + SERVER_PORT);
console.log('   Stay Duration: 90 seconds');
console.log('   Reconnect Delay: 3 minutes');
console.log('   Web Dashboard: http://localhost:' + PORT);
console.log('\n' + '█'.repeat(60) + '\n');

logWithTime('⏰ First bot will start in 30 seconds...');
logWithTime('🌐 Web dashboard is running on port ' + PORT);

setTimeout(() => {
  logWithTime('🎬 Starting first bot now!');
  createBot();
}, 30000);

setInterval(() => {
  console.log('\n' + '-'.repeat(60));
  logWithTime('📊 STATUS UPDATE');
  logWithTime('   Total Attempts: ' + totalAttempts);
  logWithTime('   Successful: ' + successfulLogins + ' (' + (totalAttempts > 0 ? Math.round(successfulLogins/totalAttempts*100) : 0) + '%)');
  logWithTime('   Failed: ' + failedAttempts);
  logWithTime('   Bot Active: ' + (botActive ? 'YES ✅' : 'NO ❌'));
  logWithTime('   Last Success: ' + (lastSuccessTime || 'Never'));
  console.log('-'.repeat(60) + '\n');
}, 60000);

process.on('SIGINT', () => {
  logWithTime('\n🛑 Shutting down gracefully...');
  if (currentBot) {
    currentBot.quit();
  }
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logWithTime('💥 Uncaught exception: ' + err.message);
  logWithTime(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  logWithTime('💥 Unhandled rejection: ' + reason);
});
