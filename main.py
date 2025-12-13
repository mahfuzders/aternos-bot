from flask import Flask
from threading import Thread
import socket
import time
import sys

app = Flask(__name__)

@app.route('/')
def home():
    return "Aternos Bot Calisiyor!"

def ping_minecraft():
    HOST = "iamsofiathefirsttt.aternos.me"
    PORT = 25565
    
    print("Bot baslatiyor...", flush=True)
    sys.stdout.flush()
    time.sleep(15)
    
    while True:
        try:
            print("Baglaniliyor: " + HOST, flush=True)
            sys.stdout.flush()
            
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            sock.connect((HOST, PORT))
            sock.sendall(b'\x00')
            sock.close()
            
            print("Ping basarili!", flush=True)
            sys.stdout.flush()
        except Exception as e:
            print("Hata: " + str(e), flush=True)
            sys.stdout.flush()
        
        time.sleep(60)

if __name__ == "__main__":
    print("Thread baslatiyor...", flush=True)
    sys.stdout.flush()
    
    t = Thread(target=ping_minecraft)
    t.daemon = True
    t.start()
    
    print("Thread basladi!", flush=True)
    sys.stdout.flush()
    
    app.run(host='0.0.0.0', port=10000, debug=False)
