from flask import Flask
from threading import Thread
import socket
import time
import sys

app = Flask(__name__)

@app.route('/')
def home():
    return "Aternos Bot Çalışıyor! ✅"

def ping_minecraft():
    HOST = "iamsofiathefirsttt.aternos.me"
    PORT = 25565
    
    print("🚀 Minecraft bot başlatılıyor...", flush=True)
    sys.stdout.flush()
    time.sleep(15)
    
    while True:
        try:
            print(f"🔄 Bağlanılıyor: {HOST}:{PORT}", flush=True)
            sys.stdout.flush()
            
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            sock.connect((HOST, PORT))
            sock.sendall(b'\x00')
            sock.close()
            
            print("✅ Ping başarılı!", flush=True)
            sys.stdout.flush()
        except Exception as e:
            print(f"⚠️ Hata: {e}", flush=True)
            sys.stdout.flush()
        
        time.sleep(60)

if __name__ == "__main__":
    print("🔥 Thread başlatılıyor...", flush=True)
    sys.stdout.flush()
    
    t = Thread(target=ping_minecraft)
    t.daemon = True
    t.start()
    
    print("✅ Thread başladı, Flask başlatılıyor...", flush=True)
    sys.stdout.flush()
    
    app.run(host='0.0.0.0', port=10000, debug=False)
```

**"Commit changes"**

---

## Render'da:

**"Manual Deploy"** → **"Clear build cache & deploy"** ← BUNU SEÇ!

---

## 3-5 Dakika Sonra Logs'ta Göreceksin:
```
🔥 Thread başlatılıyor...
✅ Thread başladı, Flask başlatılıyor...
🚀 Minecraft bot başlatılıyor...
🔄 Bağlanılıyor: iamsofiathefirsttt.aternos.me:25565
✅ Ping başarılı!
