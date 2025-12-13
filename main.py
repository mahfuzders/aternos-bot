from flask import Flask
import requests
import time
from threading import Thread

app = Flask(__name__)

@app.route('/')
def home():
    return "Aternos Bot Çalışıyor! ✅"

def ping_aternos():
    # Aternos sunucu adresiniz
    SUNUCU_ADI = "iamsofiathefirsttt.aternos.me"
    
    while True:
        try:
            print("🔄 Aternos'a ping atılıyor...")
            requests.get(f"https://{SUNUCU_ADI}", timeout=10)
            print("✅ Ping başarılı!")
        except Exception as e:
            print(f"⚠️ Ping hatası: {e}")
        
        time.sleep(300)  # 5 dakikada bir

if __name__ == "__main__":
    print("🚀 Bot başlatılıyor...")
    Thread(target=ping_aternos, daemon=True).start()
    app.run(host='0.0.0.0', port=10000)
