const mineflayer = require('mineflayer');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot çalışıyor!');
});

app.listen(PORT, () => {
    console.log('Web server hazır');
});

let bot = null;
let isConnecting = false;
let shouldReconnect = true;

function getRandomUsername() {
    const prefixes = [
        'Dark', 'Shadow', 'Fire', 'Ice', 'Thunder', 'Storm', 'Night', 'Blood', 'Soul', 'Ghost',
        'Dragon', 'Wolf', 'Tiger', 'Lion', 'Eagle', 'Hawk', 'Raven', 'Phoenix', 'Demon', 'Angel',
        'King', 'Queen', 'Lord', 'Master', 'Legend', 'Epic', 'Super', 'Ultra', 'Mega', 'Hyper',
        'Pro', 'Ace', 'Elite', 'Prime', 'Alpha', 'Beta', 'Omega', 'Nova', 'Star', 'Sky',
        'Moon', 'Sun', 'Light', 'Void', 'Frost', 'Flame', 'Aqua', 'Terra', 'Aero', 'Metal'
    ];
    
    const suffixes = [
        'Slayer', 'Killer', 'Hunter', 'Destroyer', 'Breaker', 'Crusher', 'Reaper', 'Striker',
        'Warrior', 'Knight', 'Guardian', 'Champion', 'Hero', 'Legend', 'Master', 'Lord',
        'King', 'Dragon', 'Wolf', 'Tiger', 'Bear', 'Eagle', 'Blade', 'Sword',
        'Rider', 'Walker', 'Runner', 'Miner', 'Builder', 'Crafter', 'Gamer', 'Player'
    ];
    
    const styles = [
        () => prefixes[Math.floor(Math.random() * prefixes.length)] + 
              suffixes[Math.floor(Math.random() * suffixes.length)] + 
              Math.floor(Math.random() * 9999),
        () => prefixes[Math.floor(Math.random() * prefixes.length)] + 
              Math.floor(Math.random() * 999) + 
              suffixes[Math.floor(Math.random() * suffixes.length)],
        () => 'xX_' + prefixes[Math.floor(Math.random() * prefixes.length)] + 
              suffixes[Math.floor(Math.random() * suffixes.length)] + '_Xx',
        () => prefixes[Math.floor(Math.random() * prefixes.length)] + '_' + 
              suffixes[Math.floor(Math.random() * suffixes.length)] + '_' + 
              Math.floor(Math.random() * 999),
        () => prefixes[Math.floor(Math.random() * prefixes.length)] + 
              Math.floor(Math.random() * 99999)
    ];
    
    let username = styles[Math.floor(Math.random() * styles.length)]();
    return username.length > 16 ? username.substring(0, 16) : username;
}

function createBot() {
    // Zaten bot varsa veya bağlanıyorsa, yeni bot oluşturma
    if (bot || isConnecting) {
        console.log('⚠️ Bot zaten aktif, yeni bot oluşturulmuyor');
        return;
    }
    
    isConnecting = true;
    const username = getRandomUsername();
    console.log('\n🤖 Yeni bot oluşturuluyor:', username);
    
    try {
        bot = mineflayer.createBot({
            host: 'iamsofiathefirsttt.aternos.me',
            port: 25565,
            username: username,
            version: '1.20.4',
            auth: 'offline',
            hideErrors: false,
            checkTimeoutInterval: 30000,
            keepAlive: true
        });

        // 60 saniye içinde bağlanamazsa timeout
        const connectionTimeout = setTimeout(() => {
            console.log('⏱️ Bağlantı zaman aşımı');
            cleanupBot();
            // 30 saniye bekle, tekrar dene
            setTimeout(() => {
                if (shouldReconnect) createBot();
            }, 30000);
        }, 60000);

        bot.once('login', () => {
            clearTimeout(connectionTimeout);
            isConnecting = false;
            console.log('✅ Giriş başarılı:', username);
            
            // 1-2 dakika kal
            const stayTime = (60 + Math.floor(Math.random() * 60)) * 1000;
            console.log('⏱️ Kalma süresi:', Math.floor(stayTime / 1000), 'saniye');
            
            setTimeout(() => {
                console.log('👋 Bot çıkıyor...');
                if (bot) {
                    try {
                        bot.end();
                    } catch (e) {}
                }
            }, stayTime);
        });

        bot.once('spawn', () => {
            console.log('🎮 Spawn oldu!');
        });

        bot.on('end', (reason) => {
            clearTimeout(connectionTimeout);
            console.log('❌ Bağlantı kesildi:', reason || 'bilinmiyor');
            
            cleanupBot();
            
            // 1-3 dakika bekle, sonra yeni bot
            const waitTime = (60 + Math.floor(Math.random() * 120)) * 1000;
            console.log('⏳ Yeni bot:', Math.floor(waitTime / 1000), 'saniye sonra');
            
            setTimeout(() => {
                if (shouldReconnect) createBot();
            }, waitTime);
        });

        bot.on('kicked', (reason) => {
            clearTimeout(connectionTimeout);
            console.log('⚠️ Kicklendi:', reason);
            
            cleanupBot();
            
            // 3 dakika bekle
            setTimeout(() => {
                if (shouldReconnect) createBot();
            }, 3 * 60 * 1000);
        });

        bot.on('error', (err) => {
            clearTimeout(connectionTimeout);
            
            if (err.code === 'ECONNREFUSED') {
                console.log('⚠️ Sunucu kapalı');
            } else if (err.code === 'ECONNRESET') {
                console.log('⚠️ Bağlantı kesildi');
            } else {
                console.log('⚠️ Hata:', err.message);
            }
            
            cleanupBot();
            
            // Hata türüne göre bekleme süresi
            const waitTime = err.code === 'ECONNREFUSED' ? 2 * 60 * 1000 : 60 * 1000;
            console.log('⏳ Yeniden deneme:', Math.floor(waitTime / 1000), 'saniye sonra');
            
            setTimeout(() => {
                if (shouldReconnect) createBot();
            }, waitTime);
        });
        
    } catch (err) {
        console.log('⚠️ Bot oluşturma hatası:', err.message);
        cleanupBot();
        
        setTimeout(() => {
            if (shouldReconnect) createBot();
        }, 60 * 1000);
    }
}

// Bot temizleme fonksiyonu
function cleanupBot() {
    isConnecting = false;
    if (bot) {
        try {
            bot.removeAllListeners();
            bot.end();
        } catch (e) {}
        bot = null;
    }
}

console.log('🚀 Minecraft Bot Başlatılıyor...');
console.log('🎯 Sunucu: iamsofiathefirsttt.aternos.me');
console.log('📦 Versiyon: 1.20.4');
console.log('🔄 Mod: Tek bot, sırayla giriş\n');

// İlk botu başlat
setTimeout(() => createBot(), 2000);

// Temizlik
process.on('SIGINT', () => {
    console.log('\n⛔ Kapatılıyor...');
    shouldReconnect = false;
    cleanupBot();
    process.exit();
});

process.on('uncaughtException', (err) => {
    console.log('⚠️ Beklenmeyen hata:', err.message);
});

process.on('unhandledRejection', (err) => {
    console.log('⚠️ Promise hatası:', err.message);
});
