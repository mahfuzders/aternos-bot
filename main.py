from flask import Flask
from threading import Thread
import socket
import time

app = Flask(__name__)

@app.route('/')
def home():
    return "Aternos Bot Çalışıyor! ✅"

def ping_minecraft():
    HOST = "iamsofiathefirsttt.aternos.me"
    PORT = 25565
    
    print("🚀 Minecraft bot başlatılıyor...")
    time.sleep(15)
    
    while True:
        try:
            print(f"🔄 Minecraft sunucusuna bağlanılıyor: {HOST}:{PORT}")
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            sock.connect((HOST, PORT))
            
            # Minecraft handshake paketi gönder
            sock.sendall(b'\x00')
            sock.close()
            
            print("✅ Minecraft ping başarılı!")
        except Exception as e:
            print(f"⚠️ Bağlantı hatası: {e}")
        
        time.sleep(60)  # 1 dakika

if __name__ == "__main__":
    Thread(target=ping_minecraft, daemon=True).start()
    app.run(host='0.0.0.0', port=10000)
