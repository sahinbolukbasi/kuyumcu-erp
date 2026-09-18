# ==============================================================================
# 💎 Sarraf Erdem IoT ERP - Raspberry Pi Pico Kurumsal Simülatör (PC Test Aracı)
# ==============================================================================
# Bu araç, gerçek bir Raspberry Pi Pico W donanımı gibi davranır:
# 1. Arka planda dahili bir HTTP Web Sunucusu çalıştırır (Port 8080).
# 2. ERP sisteminden gelen IP durum/ping isteklerine JSON ve Web Arayüzü ile yanıt verir.
# 3. 'a' tuşuna basıldığında ERP'ye gerçek zamanlı Alarm gönderir.
# 4. Periyodik Heartbeat atarak ağ kesintilerini anlık ölçer.
# ==============================================================================

import time
import json
import urllib.request
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

SERVER_URL = "http://127.0.0.1:8000"
SIMULATOR_PORT = 8080
HEARTBEAT_SEC = 5
start_time = time.time()

stats = {
    "total_heartbeats": 0,
    "total_alarms": 0,
    "success": 0,
    "failed": 0,
    "last_latency_ms": 0,
    "last_alarm_time": "Yok",
    "wifi_rssi": -52
}

class PicoHttpHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass # Konsolu temiz tut

    def do_GET(self):
        up_sec = int(time.time() - start_time)
        uptime_str = f"{up_sec // 3600:02d}:{(up_sec % 3600) // 60:02d}:{up_sec % 60:02d}"

        if self.path.startswith("/api/status") or self.path.startswith("/status"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            data = {
                "status": "ONLINE",
                "device_id": "PICO_SIMULATOR",
                "slot_number": 1,
                "ip_address": f"127.0.0.1:{SIMULATOR_PORT}",
                "wifi_rssi": stats["wifi_rssi"],
                "uptime": uptime_str,
                "total_alarms": stats["total_alarms"],
                "last_alarm_time": stats["last_alarm_time"],
                "total_heartbeats": stats["total_heartbeats"],
                "last_latency_ms": stats["last_latency_ms"],
                "firmware_version": "2.1.0-Simulated"
            }
            self.wfile.write(json.dumps(data).encode("utf-8"))
            print(f"📡 [ERP İSTEĞİ CEVAPLANDI] GET {self.path} -> 200 OK (Cihaz Sağlığı İletildi)")

        elif self.path.startswith("/api/ping"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "pong", "device_id": "PICO_SIMULATOR"}).encode("utf-8"))

        else:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sarraf Erdem IoT Simülatör</title>
            <style>body{{font-family:sans-serif;background:#0c0e14;color:#fff;padding:24px;max-width:480px;margin:auto;}}
            .card{{background:#151822;border:1px solid #2d3748;padding:16px;border-radius:12px;margin-bottom:12px;}}
            .badge{{background:#22543d;color:#68d391;padding:4px 8px;border-radius:12px;font-size:12px;}}
            </style></head><body>
            <div class="card"><h2>💎 Sarraf Erdem IoT Simülatörü <span class="badge">● ONLINE</span></h2>
            <p>IP: 127.0.0.1:{SIMULATOR_PORT} | Wi-Fi RSSI: {stats['wifi_rssi']} dBm (Mükemmel)</p>
            <p>Uptime: {uptime_str} | Toplam Alarm: {stats['total_alarms']}</p>
            <button style="width:100%;padding:10px;background:#d69e2e;font-weight:bold;border:none;border-radius:8px;cursor:pointer;" onclick="fetch('/api/trigger', {{method:'POST'}}).then(()=>alert('Alarm iletildi!'));">🚨 Web Paneli Alarm Testi</button>
            </div></body></html>"""
            self.wfile.write(html.encode("utf-8"))

    def do_POST(self):
        if self.path.startswith("/api/trigger"):
            trigger_alarm()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "alarm_sent"}).encode("utf-8"))

def start_embedded_server():
    server = HTTPServer(("0.0.0.0", SIMULATOR_PORT), PicoHttpHandler)
    server.serve_forever()

def send_request(endpoint, payload):
    t_start = time.time()
    url = f"{SERVER_URL}{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=3) as res:
            latency = int((time.time() - t_start) * 1000)
            stats["success"] += 1
            stats["last_latency_ms"] = latency
            return res.status, latency, res.read().decode("utf-8")
    except Exception as e:
        latency = int((time.time() - t_start) * 1000)
        stats["failed"] += 1
        stats["last_latency_ms"] = latency
        return 0, latency, str(e)

sim_state = {
    "is_online": True
}

def trigger_alarm():
    stats["total_alarms"] += 1
    stats["last_alarm_time"] = time.strftime("%H:%M:%S")
    print(f"\n🚨 [FİZİKSEL BUTON] Alarm #{stats['total_alarms']} ERP'ye gönderiliyor...")
    status, latency, body = send_request("/api/v1/iot/alert", {
        "slot_number": 1,
        "alert_type": "EMERGENCY_BUTTON",
        "details": f"Fiziksel Buton Tetiklendi (#{stats['total_alarms']}) - Canlı Donanım Alarmı"
    })
    if 200 <= status < 300:
        print(f"✅ [ALARM İŞLENDİ] HTTP {status} | Gecikme: {latency} ms")
    else:
        print(f"❌ [İLETİM HATASI] HTTP {status} | Hata: {body}")

def heartbeat_worker():
    while True:
        time.sleep(HEARTBEAT_SEC)
        if not sim_state["is_online"]:
            continue # Kesinti simüle ediliyor, paket gönderme

        stats["total_heartbeats"] += 1
        status, latency, body = send_request("/api/v1/iot/telemetry", {
            "device_id": "PICO_SIMULATOR",
            "slot_number": 1,
            "weight_grams": 86.50
        })
        now = time.strftime("%H:%M:%S")
        if 200 <= status < 300:
            print(f"[{now}] [HEARTBEAT #{stats['total_heartbeats']:03d}] 🟢 Çevrimiçi | Ping: {latency}ms | Kod: {status}")
        else:
            print(f"[{now}] [HEARTBEAT #{stats['total_heartbeats']:03d}] 🔴 Kesinti! Hata: {body}")

if __name__ == "__main__":
    print("=" * 65)
    print("💎 Raspberry Pi Pico Çift Yönlü Donanım Simülatörü")
    print(f"🌐 Gömülü Web Sunucu : http://127.0.0.1:{SIMULATOR_PORT}")
    print(f"🎯 Hedef ERP         : {SERVER_URL}")
    print("👉 'a' + Enter       : Fiziksel butona basıp ALARM tetikler")
    print("👉 'k' + Enter       : 🔴 BAĞLANTIYI KOPAR (Watchdog Alarm Testi)")
    print("👉 'b' + Enter       : 🟢 YENİDEN BAĞLAN (Canlılık Testi)")
    print("👉 'q' + Enter       : Çıkış")
    print("=" * 65)

    # Gömülü Web Sunucusunu Arka Planda Başlat
    t_web = threading.Thread(target=start_embedded_server, daemon=True)
    t_web.start()

    # Heartbeat Döngüsü
    t_hb = threading.Thread(target=heartbeat_worker, daemon=True)
    t_hb.start()

    while True:
        try:
            cmd = input().strip().lower()
            if cmd == "a":
                trigger_alarm()
            elif cmd == "k":
                sim_state["is_online"] = False
                print("\n🔌 [KOPMA SİMÜLE EDİLDİ] Donanım bağlantısı KOPARILDI! ERP Watchdog 15 saniye içinde alarm verecek...\n")
            elif cmd == "b":
                sim_state["is_online"] = True
                print("\n⚡ [BAĞLANTI GERİ GELDİ] Cihaz tekrar Wi-Fi'a bağlandı ve heartbeat gönderiyor!\n")
            elif cmd == "q":
                break
        except (KeyboardInterrupt, EOFError):
            break
