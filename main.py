from flask import Flask
from threading import Thread
import socket
import struct
import time
import sys

app = Flask(__name__)

@app.route('/')
def home():
    return "Aternos Bot Calisiyor!"

def create_handshake_packet(host, port):
    packet = b'\x00'
    packet += b'\x00'
    packet += struct.pack('>B', len(host)) + host.encode('utf-8')
    packet += struct.pack('>H', port)
    packet += b'\x01'
    length = struct.pack('>B', len(packet))
    return length + packet

def create_status_request():
    return b'\x01\x00'

def ping_minecraft():
    HOST = "iamsofiathefirsttt.aternos.me"
    PORT = 25565
    
    print("Bot baslatiyor...", flush=True)
    time.sleep(15)
    
    while True:
        try:
            print("Minecraft sunucusuna baglaniliyor...", flush=True)
            
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            sock.connect((HOST, PORT))
            
            handshake = create_handshake_packet(HOST, PORT)
            sock.sendall(handshake)
            
            status_request = create_status_request()
            sock.sendall(status_request)
            
            response = sock.recv(4096)
            sock.close()
            
            if len(response) > 0:
                print("BASARILI! Sunucu yanit verdi!", flush=True)
            else:
                print("Yanit bos", flush=True)
                
        except Exception as e:
            print("Hata: " + str(e), flush=True)
        
        time.sleep(60)

if __name__ == "__main__":
    print("Thread baslatiyor...", flush=True)
    
    t = Thread(target=ping_minecraft)
    t.daemon = True
    t.start()
    
    print("Flask baslatiyor...", flush=True)
    app.run(host='0.0.0.0', port=10000, debug=False)
