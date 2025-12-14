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

let bot;
let isConnecting = false;

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
    if (isConnecting) {
        console.log('⚠️ Zaten bağlanıyor, bekle...');
        return;
    }
    
    isConnecting = true;
    
    // Eski botu temizle
    if (bot) {
        try {
            bot.removeAllListeners();
            bot.end();
        } catch (e) {}
        bot = null;
    }

    const username = getRandomUsername();
    console.log('\n🤖 Yeni bot:', username);
    
    try {
        bot = mineflayer.createBot({
            host: 'iamsofiathefirsttt.aternos.me',
            port: 25565,
            username: username,
            version: '1.20.1',
            auth: 'offline',
            hideErrors: false,
            checkTimeoutInterval: 30000,
            keepAlive: true
        });

        // Timeout ekle - 60 saniye içinde bağlanamazsa yeniden dene
        const connectionTimeout = setTimeout(() => {
            console.log('⏱️ Bağlantı zaman aşımı, yeniden deneniyor...');
            isConnecting = false;
            if (bot) {
                try {
                    bot.end();
                } catch (e) {}
            }
            setTimeout(() => createBot(), 30000);
        }, 60000);

        bot.once('login', () => {
            clearTimeout(connectionTimeout);
            isConnecting = false;
            console.log('✅ Giriş başarılı:', username);
            
            // 1-2 dakika kal
            const stayTime = (60 + Math.floor(Math.random() * 60)) * 1000;
            console.log('⏱️ Kalma süresi:', Math.floor(stayTime / 1000), 'saniye');
            
            setTimeout(() => {
                console.log('👋 Çıkıyor...');
                try {
                    bot.end();
                } catch (e) {}
            }, stayTime);
        });

        bot.once('spawn', () => {
            console.log('🎮 Spawn oldu!');
        });

        bot.on('end', (reason) => {
            clearTimeout(connectionTimeout);
            isConnecting = false;
            console.log('❌ Bağlantı kesildi:', reason || 'bilinmiyor');
            
            // 1-3 dakika bekle
            const waitTime = (60 + Math.floor(Math.random() * 120)) * 1000;
            console.log('⏳ Bekleme:', Math.floor(waitTime / 1000), 'saniye');
            
            setTimeout(() => createBot(), waitTime);
        });

        bot.on('kicked', (reason) => {
            clearTimeout(connectionTimeout);
            isConnecting = false;
            console.log('⚠️ Kicklendi:', reason);
            
            // 3 dakika bekle
            setTimeout(() => createBot(), 3 * 60 * 1000);
        });

        bot.on('error', (err) => {
            clearTimeout(connectionTimeout);
            isConnecting = false;
            
            // Önemli hataları logla
            if (err.code === 'ECONNREFUSED') {
                console.log('⚠️ Sunucu kapalı, 2 dakika bekle...');
                setTimeout(() => createBot(), 2 * 60 * 1000);
            } else if (err.code === 'ECONNRESET') {
                console.log('⚠️ Bağlantı kesildi, 1 dakika bekle...');
                setTimeout(() => createBot(), 60 * 1000);
            } else {
                console.log('⚠️ Hata:', err.message);
                setTimeout(() => createBot(), 90 * 1000);
            }
        });
        
    } catch (err) {
        isConnecting = false;
        console.log('⚠️ Bot oluşturma hatası:', err.message);
        setTimeout(() => createBot(), 60 * 1000);
    }
}

console.log('🚀 Bot başlatılıyor...');
console.log('🎯 Sunucu: iamsofiathefirsttt.aternos.me\n');

// İlk botu başlat
setTimeout(() => createBot(), 2000);

// Temizlik
process.on('SIGINT', () => {
    console.log('\n⛔ Kapatılıyor...');
    if (bot) {
        try {
            bot.end();
        } catch (e) {}
    }
    process.exit();
});

process.on('uncaughtException', (err) => {
    console.log('⚠️ Beklenmeyen hata:', err.message);
});

process.on('unhandledRejection', (err) => {
    console.log('⚠️ Promise hatası:', err.message);
});
