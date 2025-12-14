const mineflayer = require('mineflayer');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Minecraft bot çalışıyor!');
});

app.listen(PORT, () => {
    console.log('Sunucu hazır, port:', PORT);
});

let bot;
let reconnectTimeout;

// Gerçekçi random isim oluştur
function getRandomUsername() {
    const prefixes = [
        'Dark', 'Shadow', 'Fire', 'Ice', 'Thunder', 'Storm', 'Night', 'Blood', 'Soul', 'Ghost',
        'Dragon', 'Wolf', 'Tiger', 'Lion', 'Eagle', 'Hawk', 'Raven', 'Phoenix', 'Demon', 'Angel',
        'King', 'Queen', 'Lord', 'Master', 'Legend', 'Epic', 'Super', 'Ultra', 'Mega', 'Hyper',
        'Pro', 'Ace', 'Elite', 'Prime', 'Alpha', 'Beta', 'Omega', 'Nova', 'Star', 'Sky',
        'Moon', 'Sun', 'Light', 'Void', 'Frost', 'Flame', 'Aqua', 'Terra', 'Aero', 'Metal',
        'Gold', 'Silver', 'Crystal', 'Diamond', 'Ruby', 'Jade', 'Onyx', 'Pearl', 'Copper', 'Iron',
        'Steel', 'Titan', 'Giant', 'Knight', 'Warrior', 'Hunter', 'Ranger', 'Mage', 'Wizard', 'Ninja',
        'Samurai', 'Ronin', 'Shogun', 'Cyber', 'Pixel', 'Neon', 'Laser', 'Turbo', 'Nitro', 'Rocket',
        'Toxic', 'Venom', 'Blaze', 'Inferno', 'Frozen', 'Arctic', 'Solar', 'Lunar', 'Cosmic', 'Astral',
        'Mystic', 'Magic', 'Ancient', 'Eternal', 'Divine', 'Sacred', 'Cursed', 'Blessed', 'Wild', 'Savage'
    ];
    
    const suffixes = [
        'Slayer', 'Killer', 'Hunter', 'Destroyer', 'Breaker', 'Crusher', 'Reaper', 'Ripper', 'Striker', 'Fighter',
        'Warrior', 'Knight', 'Guardian', 'Defender', 'Protector', 'Champion', 'Hero', 'Legend', 'Master', 'Lord',
        'King', 'Emperor', 'Ruler', 'Commander', 'General', 'Captain', 'Chief', 'Boss', 'Leader', 'God',
        'Demon', 'Devil', 'Beast', 'Monster', 'Dragon', 'Wolf', 'Tiger', 'Lion', 'Bear', 'Shark',
        'Eagle', 'Hawk', 'Falcon', 'Raven', 'Phoenix', 'Storm', 'Thunder', 'Lightning', 'Blade', 'Sword',
        'Axe', 'Hammer', 'Spear', 'Arrow', 'Bow', 'Staff', 'Wand', 'Fist', 'Claw', 'Fang',
        'Eye', 'Soul', 'Heart', 'Mind', 'Spirit', 'Shadow', 'Phantom', 'Ghost', 'Wraith', 'Specter',
        'Rider', 'Walker', 'Runner', 'Jumper', 'Climber', 'Flyer', 'Diver', 'Swimmer', 'Digger', 'Miner',
        'Builder', 'Crafter', 'Smith', 'Forger', 'Maker', 'Creator', 'Designer', 'Architect', 'Engineer', 'Pilot',
        'Gamer', 'Player', 'Noob', 'Pro', 'Hacker', 'Coder', 'Programmer', 'Developer', 'Tester', 'Admin'
    ];
    
    const styles = [
        () => {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            const num = Math.floor(Math.random() * 9999);
            return prefix + suffix + num;
        },
        () => {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            const num = Math.floor(Math.random() * 999);
            return prefix + num + suffix;
        },
        () => {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            return 'xX_' + prefix + suffix + '_Xx';
        },
        () => {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            const num = Math.floor(Math.random() * 999);
            return prefix + '_' + suffix + '_' + num;
        },
        () => {
            const name = prefixes[Math.floor(Math.random() * prefixes.length)];
            const num = Math.floor(Math.random() * 99999);
            return name + num;
        },
        () => {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            return 'iTs' + prefix + suffix;
        },
        () => {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            const platform = Math.random() > 0.5 ? 'YT' : 'TTV';
            return prefix + suffix + platform;
        },
        () => {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)].toLowerCase();
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)].toLowerCase();
            const num = Math.floor(Math.random() * 9999);
            return prefix + suffix + num;
        }
    ];
    
    const selectedStyle = styles[Math.floor(Math.random() * styles.length)];
    let username = selectedStyle();
    
    if (username.length > 16) {
        username = username.substring(0, 16);
    }
    
    return username;
}

function createBot() {
    if (bot) {
        bot.removeAllListeners();
        try {
            bot.quit();
        } catch (e) {}
    }

    const username = getRandomUsername();
    console.log('🤖 Yeni bot oluşturuluyor...');
    console.log('👤 İsim:', username);
    
    bot = mineflayer.createBot({
        host: 'iamsofiathefirsttt.aternos.me',
        port: 25565,
        username: username,
        version: '1.20.1',
        auth: 'offline',
        hideErrors: true
    });

    bot.on('login', () => {
        console.log('✅ Sunucuya giriş yapıldı!');
        console.log('👤 Oyuncu:', username);
        
        const stayTime = (45 + Math.floor(Math.random() * 45)) * 1000;
        console.log('⏱️ Sunucuda kalma süresi:', Math.floor(stayTime / 1000), 'saniye');
        
        setTimeout(() => {
            console.log('👋 Bot çıkıyor...');
            try {
                bot.quit();
            } catch (e) {}
        }, stayTime);
    });

    bot.on('spawn', () => {
        console.log('🎮 Oyuna spawn oldu!');
        
        if (Math.random() > 0.7) {
            setTimeout(() => {
                const messages = ['hi', 'hello', 'hey', 'sup', 'yo'];
                const randomMsg = messages[Math.floor(Math.random() * messages.length)];
                try {
                    bot.chat(randomMsg);
                    console.log('💬 Mesaj gönderildi:', randomMsg);
                } catch (e) {}
            }, 3000);
        }
    });

    bot.on('end', () => {
        console.log('❌ Bot sunucudan ayrıldı');
        
        const waitTime = (30 + Math.floor(Math.random() * 90)) * 1000;
        console.log('⏳ Yeniden bağlanma:', Math.floor(waitTime / 1000), 'saniye sonra\n');
        
        reconnectTimeout = setTimeout(() => {
            createBot();
        }, waitTime);
    });

    bot.on('kicked', (reason) => {
        console.log('⚠️ Kicklendi:', reason);
        
        const waitTime = (120 + Math.floor(Math.random() * 60)) * 1000;
        console.log('⏳ Yeniden deneme:', Math.floor(waitTime / 1000), 'saniye sonra\n');
        
        reconnectTimeout = setTimeout(() => {
            createBot();
        }, waitTime);
    });

    bot.on('error', (err) => {
        console.log('⚠️ Hata:', err.message);
        
        const waitTime = (60 + Math.floor(Math.random() * 60)) * 1000;
        
        reconnectTimeout = setTimeout(() => {
            createBot();
        }, waitTime);
    });
}

console.log('🚀 Minecraft Aternos Bot Başlatılıyor...');
console.log('🎯 Sunucu: iamsofiathefirsttt.aternos.me');
console.log('─────────────────────────────────────\n');

createBot();

process.on('SIGINT', () => {
    console.log('\n⛔ Bot kapatılıyor...');
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (bot) {
        try {
            bot.quit();
        } catch (e) {}
    }
    process.exit();
}); 
