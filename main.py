from flask import Flask
from threading import Thread
import time
import sys
import socket
import json
import struct
import random

app = Flask(__name__)

@app.route('/')
def home():
    return "Aternos Bot Calisiyor - Tam Protokol!"

class MinecraftBot:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.socket = None
        
    def pack_varint(self, value):
        data = b''
        while True:
            byte = value & 0x7F
            value >>= 7
            if value != 0:
                byte |= 0x80
            data += struct.pack('B', byte)
            if value == 0:
                break
        return data
    
    def pack_string(self, text):
        text_bytes = text.encode('utf-8')
        return self.pack_varint(len(text_bytes)) + text_bytes
    
    def pack_data(self, data):
        return self.pack_varint(len(data)) + data
    
    def unpack_varint(self):
        value = 0
        position = 0
        while True:
            byte_data = self.socket.recv(1)
            if len(byte_data) == 0:
                return None
            byte = struct.unpack('B', byte_data)[0]
            value |= (byte & 0x7F) << position
            if (byte & 0x80) == 0:
                break
            position += 7
            if position >= 32:
                raise ValueError("VarInt too big")
        return value
    
    def send_handshake(self):
        packet_id = b'\x00'
        protocol_version = self.pack_varint(760)
        server_address = self.pack_string(self.host)
        server_port = struct.pack('>H', self.port)
        next_state = self.pack_varint(2)
        
        handshake_data = packet_id + protocol_version + server_address + server_port + next_state
        packet = self.pack_data(handshake_data)
        
        self.socket.sendall(packet)
        print("Handshake gonderildi", flush=True)
    
    def send_login_start(self, username):
        packet_id = b'\x00'
        username_data = self.pack_string(username)
        
        login_data = packet_id + username_data
        packet = self.pack_data(login_data)
        
        self.socket.sendall(packet)
        print("Login start gonderildi: " + username, flush=True)
    
    def read_packet(self):
        try:
            length = self.unpack_varint()
            if length is None:
                return None
            
            data = b''
            while len(data) < length:
                chunk = self.socket.recv(length - len(data))
                if not chunk:
                    return None
                data += chunk
            
            return data
        except:
            return None
    
    def send_keep_alive(self, keep_alive_id):
        try:
            packet_id = b'\x0F'
            ka_data = struct.pack('>Q', keep_alive_id)
            packet_data = packet_id + ka_data
            packet = self.pack_data(packet_data)
            self.socket.sendall(packet)
            print("Keep-Alive gonderildi: " + str(keep_alive_id), flush=True)
        except Exception as e:
            print("Keep-Alive hatasi: " + str(e), flush=True)
    
    def connect_and_maintain(self):
        try:
            print("Sunucuya baglaniliyor: " + self.host + ":" + str(self.port), flush=True)
            
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(30)
            self.socket.connect((self.host, self.port))
            
            print("Socket baglantisi basarili!", flush=True)
            
            self.send_handshake()
            time.sleep(0.5)
            
            username = "AternosBot" + str(random.randint(1000, 9999))
            self.send_login_start(username)
            
            print("Paket okuma basladi...", flush=True)
            
            start_time = time.time()
            keep_alive_counter = 0
            
            while time.time() - start_time < 120:
                packet_data = self.read_packet()
                
                if packet_data is None:
                    print("Baglanti koptu", flush=True)
                    break
                
                if len(packet_data) > 0:
                    packet_id = packet_data[0]
                    
                    if packet_id == 0x00:
                        print("Disconnect mesaji alindi", flush=True)
                        break
                    
                    elif packet_id == 0x02:
                        print("Login Success alindi!", flush=True)
                    
                    elif packet_id == 0x21:
                        if len(packet_data) >= 9:
                            ka_id = struct.unpack('>Q', packet_data[1:9])[0]
                            print("Keep-Alive istegi alindi: " + str(ka_id), flush=True)
                            self.send_keep_alive(ka_id)
                            keep_alive_counter += 1
                    
                    else:
                        print("Paket alindi ID: " + hex(packet_id), flush=True)
                
                time.sleep(0.1)
            
            print("Toplam " + str(keep_alive_counter) + " keep-alive gonderildi", flush=True)
            print("2 dakika tamamlandi, baglanti kapatiliyor", flush=True)
            
        except socket.timeout:
            print("Socket timeout", flush=True)
        except Exception as e:
            print("Baglanti hatasi: " + str(e), flush=True)
        finally:
            if self.socket:
                try:
                    self.socket.close()
                except:
                    pass
            print("Socket kapatildi", flush=True)

def bot_loop():
    HOST = "iamsofiathefirsttt.aternos.me"
    PORT = 25565
    
    print("=== MINECRAFT BOT BASLADI ===", flush=True)
    print("Hedef: " + HOST + ":" + str(PORT), flush=True)
    
    time.sleep(20)
    
    while True:
        try:
            print("\n--- Yeni baglanti denemesi ---", flush=True)
            bot = MinecraftBot(HOST, PORT)
            bot.connect_and_maintain()
            print("Baglanti tamamlandi, 60 saniye bekleniyor...", flush=True)
            time.sleep(60)
            
        except Exception as e:
            print("Ana dongu hatasi: " + str(e), flush=True)
            time.sleep(60)

if __name__ == "__main__":
    print("Flask ve Bot baslatiyor...", flush=True)
    sys.stdout.flush()
    
    bot_thread = Thread(target=bot_loop)
    bot_thread.daemon = True
    bot_thread.start()
    
    print("Thread baslatildi, Flask aciliyor...", flush=True)
    sys.stdout.flush()
    
    app.run(host='0.0.0.0', port=10000, debug=False)
